/**
 * Memory-optimized buffers for ψ-Trajectory
 * ------------------------------------------------------------------
 * Provides optimized buffer implementations for memory-sensitive operations:
 * - SmallVec-based temporary buffers for delta encoding
 * - Adaptive ring buffers for audio/oscillator states
 * - Buffer pooling for high-frequency temporary allocations
 */

use std::alloc::{self, Layout};
use std::marker::PhantomData;
use std::mem;
use std::ops::{Deref, DerefMut};
use std::ptr::{self, NonNull};

/// Memory-optimized vector implementation similar to SmallVec
/// 
/// Stores small arrays inline to avoid heap allocations for the common case
/// of small buffers. When the inline capacity is exceeded, it allocates on
/// the heap like a regular Vec.
#[derive(Debug)]
pub struct InlineVec<T, const N: usize> {
    // Number of elements currently stored
    len: usize,
    
    // Union of inline array or heap-allocated buffer
    // Since Rust doesn't allow untagged unions with Drop types,
    // we have to manually handle this with raw pointers
    data: InlineVecData<T, N>,
    
    // Phantom data to mark T as used
    _marker: PhantomData<T>,
}

/// Union-like storage for either inline or heap data
#[derive(Debug)]
enum InlineVecData<T, const N: usize> {
    // Inline storage for small arrays
    Inline([MaybeUninit<T>; N]),
    
    // Heap allocation for larger arrays
    Heap {
        ptr: NonNull<T>,
        capacity: usize,
    },
}

/// MaybeUninit wrapper for safely handling uninitialized memory
#[derive(Debug, Copy, Clone)]
struct MaybeUninit<T> {
    // Raw storage for a T value
    value: mem::MaybeUninit<T>,
}

impl<T> MaybeUninit<T> {
    /// Create a new uninitialized slot
    fn uninit() -> Self {
        Self {
            value: mem::MaybeUninit::uninit(),
        }
    }
    
    /// Create a new initialized slot
    fn new(value: T) -> Self {
        Self {
            value: mem::MaybeUninit::new(value),
        }
    }
    
    /// Get a reference to the value (unsafe)
    unsafe fn get_ref(&self) -> &T {
        &*self.value.as_ptr()
    }
    
    /// Get a mutable reference to the value (unsafe)
    unsafe fn get_mut(&mut self) -> &mut T {
        &mut *self.value.as_mut_ptr()
    }
    
    /// Extract the value (unsafe)
    unsafe fn assume_init(self) -> T {
        self.value.assume_init()
    }
}

impl<T, const N: usize> InlineVec<T, N> {
    /// Create a new empty InlineVec
    pub fn new() -> Self {
        Self {
            len: 0,
            data: InlineVecData::Inline(Self::create_uninit_array()),
            _marker: PhantomData,
        }
    }
    
    /// Create a new InlineVec with the specified capacity
    pub fn with_capacity(capacity: usize) -> Self {
        if capacity <= N {
            Self::new()
        } else {
            let layout = Layout::array::<T>(capacity).unwrap();
            
            // Safety: We're allocating memory with proper alignment for T
            let ptr = unsafe {
                let ptr = alloc::alloc(layout);
                NonNull::new(ptr as *mut T).unwrap()
            };
            
            Self {
                len: 0,
                data: InlineVecData::Heap {
                    ptr,
                    capacity,
                },
                _marker: PhantomData,
            }
        }
    }
    
    /// Create a new InlineVec from a slice
    pub fn from_slice(slice: &[T]) -> Self
    where
        T: Clone,
    {
        let mut vec = Self::with_capacity(slice.len());
        
        for item in slice {
            vec.push(item.clone());
        }
        
        vec
    }
    
    /// Create a new InlineVec from an iterator
    pub fn from_iter<I>(iter: I) -> Self
    where
        I: IntoIterator<Item = T>,
    {
        let iter = iter.into_iter();
        let (min, _) = iter.size_hint();
        
        let mut vec = Self::with_capacity(min);
        
        for item in iter {
            vec.push(item);
        }
        
        vec
    }
    
    /// Add an element to the end of the buffer
    pub fn push(&mut self, value: T) {
        if self.len == self.capacity() {
            self.grow(self.len + 1);
        }
        
        unsafe {
            match &mut self.data {
                InlineVecData::Inline(array) => {
                    ptr::write(array[self.len].value.as_mut_ptr(), value);
                }
                InlineVecData::Heap { ptr, .. } => {
                    ptr::write(ptr.as_ptr().add(self.len), value);
                }
            }
        }
        
        self.len += 1;
    }
    
    /// Remove and return the last element
    pub fn pop(&mut self) -> Option<T> {
        if self.len == 0 {
            return None;
        }
        
        self.len -= 1;
        
        unsafe {
            match &mut self.data {
                InlineVecData::Inline(array) => {
                    Some(ptr::read(array[self.len].value.as_ptr()))
                }
                InlineVecData::Heap { ptr, .. } => {
                    Some(ptr::read(ptr.as_ptr().add(self.len)))
                }
            }
        }
    }
    
    /// Get the length of the buffer
    pub fn len(&self) -> usize {
        self.len
    }
    
    /// Check if the buffer is empty
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }
    
    /// Get the capacity of the buffer
    pub fn capacity(&self) -> usize {
        match &self.data {
            InlineVecData::Inline(_) => N,
            InlineVecData::Heap { capacity, .. } => *capacity,
        }
    }
    
    /// Check if the buffer is using inline storage
    pub fn is_inline(&self) -> bool {
        matches!(&self.data, InlineVecData::Inline(_))
    }
    
    /// Reserve space for additional elements
    pub fn reserve(&mut self, additional: usize) {
        let new_capacity = self.len.saturating_add(additional);
        
        if new_capacity > self.capacity() {
            self.grow(new_capacity);
        }
    }
    
    /// Clear all elements from the buffer
    pub fn clear(&mut self) {
        // Drop all elements
        for i in 0..self.len {
            unsafe {
                match &mut self.data {
                    InlineVecData::Inline(array) => {
                        ptr::drop_in_place(array[i].value.as_mut_ptr());
                    }
                    InlineVecData::Heap { ptr, .. } => {
                        ptr::drop_in_place(ptr.as_ptr().add(i));
                    }
                }
            }
        }
        
        self.len = 0;
    }
    
    /// Resize the buffer with a default value
    pub fn resize(&mut self, new_len: usize, value: T)
    where
        T: Clone,
    {
        if new_len > self.len {
            // Grow buffer
            if new_len > self.capacity() {
                self.grow(new_len);
            }
            
            // Fill with value
            for _ in self.len..new_len {
                self.push(value.clone());
            }
        } else if new_len < self.len {
            // Drop extra elements
            for i in new_len..self.len {
                unsafe {
                    match &mut self.data {
                        InlineVecData::Inline(array) => {
                            ptr::drop_in_place(array[i].value.as_mut_ptr());
                        }
                        InlineVecData::Heap { ptr, .. } => {
                            ptr::drop_in_place(ptr.as_ptr().add(i));
                        }
                    }
                }
            }
            
            self.len = new_len;
        }
    }
    
    /// Get a reference to an element at a specific index
    pub fn get(&self, index: usize) -> Option<&T> {
        if index >= self.len {
            return None;
        }
        
        unsafe {
            match &self.data {
                InlineVecData::Inline(array) => {
                    Some(array[index].get_ref())
                }
                InlineVecData::Heap { ptr, .. } => {
                    Some(&*ptr.as_ptr().add(index))
                }
            }
        }
    }
    
    /// Get a mutable reference to an element at a specific index
    pub fn get_mut(&mut self, index: usize) -> Option<&mut T> {
        if index >= self.len {
            return None;
        }
        
        unsafe {
            match &mut self.data {
                InlineVecData::Inline(array) => {
                    Some(array[index].get_mut())
                }
                InlineVecData::Heap { ptr, .. } => {
                    Some(&mut *ptr.as_ptr().add(index))
                }
            }
        }
    }
    
    /// Convert to a standard Vec
    pub fn to_vec(&self) -> Vec<T>
    where
        T: Clone,
    {
        let mut vec = Vec::with_capacity(self.len);
        
        for i in 0..self.len {
            unsafe {
                match &self.data {
                    InlineVecData::Inline(array) => {
                        vec.push(array[i].get_ref().clone());
                    }
                    InlineVecData::Heap { ptr, .. } => {
                        vec.push((*ptr.as_ptr().add(i)).clone());
                    }
                }
            }
        }
        
        vec
    }
    
    /// Create an array of uninitialized values
    fn create_uninit_array() -> [MaybeUninit<T>; N] {
        unsafe {
            // Initialize the memory with MaybeUninit::uninit()
            let mut data: [MaybeUninit<T>; N] = mem::MaybeUninit::uninit().assume_init();
            for item in data.iter_mut() {
                *item = MaybeUninit::uninit();
            }
            data
        }
    }
    
    /// Grow the buffer to the specified capacity
    fn grow(&mut self, min_capacity: usize) {
        let new_capacity = std::cmp::max(
            min_capacity,
            std::cmp::max(self.capacity() * 2, N),
        );
        
        // Allocate new buffer
        let layout = Layout::array::<T>(new_capacity).unwrap();
        let new_ptr = unsafe {
            let ptr = alloc::alloc(layout);
            NonNull::new(ptr as *mut T).unwrap()
        };
        
        // Copy existing elements
        for i in 0..self.len {
            unsafe {
                match &self.data {
                    InlineVecData::Inline(array) => {
                        ptr::write(
                            new_ptr.as_ptr().add(i),
                            ptr::read(array[i].value.as_ptr()),
                        );
                    }
                    InlineVecData::Heap { ptr, .. } => {
                        ptr::copy_nonoverlapping(
                            ptr.as_ptr().add(i),
                            new_ptr.as_ptr().add(i),
                            1,
                        );
                    }
                }
            }
        }
        
        // Free old heap buffer if needed
        if let InlineVecData::Heap { ptr, capacity } = self.data {
            unsafe {
                let old_layout = Layout::array::<T>(*capacity).unwrap();
                alloc::dealloc(ptr.as_ptr() as *mut u8, old_layout);
            }
        }
        
        // Update data
        self.data = InlineVecData::Heap {
            ptr: new_ptr,
            capacity: new_capacity,
        };
    }
}

impl<T, const N: usize> Drop for InlineVec<T, N> {
    fn drop(&mut self) {
        // Drop all elements
        self.clear();
        
        // Free heap memory if needed
        if let InlineVecData::Heap { ptr, capacity } = self.data {
            unsafe {
                let layout = Layout::array::<T>(capacity).unwrap();
                alloc::dealloc(ptr.as_ptr() as *mut u8, layout);
            }
        }
    }
}

impl<T, const N: usize> Deref for InlineVec<T, N> {
    type Target = [T];
    
    fn deref(&self) -> &Self::Target {
        unsafe {
            match &self.data {
                InlineVecData::Inline(array) => {
                    std::slice::from_raw_parts(
                        array.as_ptr() as *const T,
                        self.len,
                    )
                }
                InlineVecData::Heap { ptr, .. } => {
                    std::slice::from_raw_parts(ptr.as_ptr(), self.len)
                }
            }
        }
    }
}

impl<T, const N: usize> DerefMut for InlineVec<T, N> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        unsafe {
            match &mut self.data {
                InlineVecData::Inline(array) => {
                    std::slice::from_raw_parts_mut(
                        array.as_mut_ptr() as *mut T,
                        self.len,
                    )
                }
                InlineVecData::Heap { ptr, .. } => {
                    std::slice::from_raw_parts_mut(ptr.as_ptr(), self.len)
                }
            }
        }
    }
}

impl<T: Clone, const N: usize> Clone for InlineVec<T, N> {
    fn clone(&self) -> Self {
        Self::from_slice(self)
    }
}

impl<T, const N: usize> From<Vec<T>> for InlineVec<T, N> {
    fn from(vec: Vec<T>) -> Self {
        let mut inline_vec = Self::with_capacity(vec.len());
        
        for item in vec {
            inline_vec.push(item);
        }
        
        inline_vec
    }
}

impl<T, const N: usize> From<InlineVec<T, N>> for Vec<T> {
    fn from(inline_vec: InlineVec<T, N>) -> Self {
        let mut vec = Vec::with_capacity(inline_vec.len());
        
        for i in 0..inline_vec.len() {
            unsafe {
                match &inline_vec.data {
                    InlineVecData::Inline(array) => {
                        vec.push(ptr::read(array[i].value.as_ptr()));
                    }
                    InlineVecData::Heap { ptr, .. } => {
                        vec.push(ptr::read(ptr.as_ptr().add(i)));
                    }
                }
            }
        }
        
        vec
    }
}

/// Adaptive ring buffer for audio samples and oscillator states
/// 
/// Automatically sizes buffer based on parameters like FPS and audio buffer length
pub struct AdaptiveRingBuffer<T> {
    // Buffer data
    buffer: Vec<T>,
    
    // Current read position
    read_pos: usize,
    
    // Current write position
    write_pos: usize,
    
    // Number of valid elements in the buffer
    len: usize,
    
    // Maximum capacity
    capacity: usize,
}

impl<T: Clone + Default> AdaptiveRingBuffer<T> {
    /// Create a new adaptive ring buffer with the specified capacity
    pub fn new(capacity: usize) -> Self {
        let mut buffer = Vec::with_capacity(capacity);
        buffer.resize(capacity, T::default());
        
        Self {
            buffer,
            read_pos: 0,
            write_pos: 0,
            len: 0,
            capacity,
        }
    }
    
    /// Create a ring buffer with adaptive capacity based on parameters
    pub fn with_adaptive_capacity(fps: f32, buffer_len: usize, scale_factor: f32) -> Self {
        // Calculate adaptive capacity: fps × buffer_len × scale_factor
        let capacity = (fps * buffer_len as f32 * scale_factor) as usize;
        Self::new(capacity)
    }
    
    /// Clear the buffer
    pub fn clear(&mut self) {
        self.read_pos = 0;
        self.write_pos = 0;
        self.len = 0;
    }
    
    /// Reset the buffer with a new capacity
    pub fn reset(&mut self, capacity: usize) {
        self.buffer.clear();
        self.buffer.resize(capacity, T::default());
        self.read_pos = 0;
        self.write_pos = 0;
        self.len = 0;
        self.capacity = capacity;
    }
    
    /// Push an item to the buffer
    pub fn push(&mut self, item: T) {
        self.buffer[self.write_pos] = item;
        self.write_pos = (self.write_pos + 1) % self.capacity;
        
        if self.len < self.capacity {
            self.len += 1;
        } else {
            // Buffer is full, advance read pointer
            self.read_pos = (self.read_pos + 1) % self.capacity;
        }
    }
    
    /// Push multiple items to the buffer
    pub fn push_slice(&mut self, items: &[T]) {
        for item in items {
            self.push(item.clone());
        }
    }
    
    /// Pop an item from the buffer
    pub fn pop(&mut self) -> Option<T> {
        if self.len == 0 {
            return None;
        }
        
        let item = self.buffer[self.read_pos].clone();
        self.read_pos = (self.read_pos + 1) % self.capacity;
        self.len -= 1;
        
        Some(item)
    }
    
    /// Pop multiple items from the buffer
    pub fn pop_multiple(&mut self, count: usize) -> Vec<T> {
        let mut result = Vec::with_capacity(count);
        
        for _ in 0..count {
            if let Some(item) = self.pop() {
                result.push(item);
            } else {
                break;
            }
        }
        
        result
    }
    
    /// Get the number of items in the buffer
    pub fn len(&self) -> usize {
        self.len
    }
    
    /// Check if the buffer is empty
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }
    
    /// Check if the buffer is full
    pub fn is_full(&self) -> bool {
        self.len == self.capacity
    }
    
    /// Get the capacity of the buffer
    pub fn capacity(&self) -> usize {
        self.capacity
    }
    
    /// Get an item at a specific index (relative to read position)
    pub fn get(&self, index: usize) -> Option<&T> {
        if index >= self.len {
            return None;
        }
        
        let pos = (self.read_pos + index) % self.capacity;
        Some(&self.buffer[pos])
    }
    
    /// Get a mutable reference to an item at a specific index
    pub fn get_mut(&mut self, index: usize) -> Option<&mut T> {
        if index >= self.len {
            return None;
        }
        
        let pos = (self.read_pos + index) % self.capacity;
        Some(&mut self.buffer[pos])
    }
}

/// A simple memory pool for 16-bit integer buffers
/// 
/// Used to avoid frequent allocations/deallocations of temporary buffers
/// during encoding/decoding operations.
pub struct I16BufferPool {
    // List of available buffers
    buffers: Vec<InlineVec<i16, 512>>,
    
    // Maximum buffer size to keep in the pool
    max_pool_size: usize,
    
    // Statistics
    hits: usize,
    misses: usize,
}

impl I16BufferPool {
    /// Create a new buffer pool
    pub fn new(max_pool_size: usize) -> Self {
        Self {
            buffers: Vec::with_capacity(max_pool_size),
            max_pool_size,
            hits: 0,
            misses: 0,
        }
    }
    
    /// Get a buffer from the pool
    pub fn get(&mut self) -> InlineVec<i16, 512> {
        if let Some(buffer) = self.buffers.pop() {
            self.hits += 1;
            buffer
        } else {
            self.misses += 1;
            InlineVec::new()
        }
    }
    
    /// Return a buffer to the pool
    pub fn put(&mut self, mut buffer: InlineVec<i16, 512>) {
        if self.buffers.len() < self.max_pool_size {
            buffer.clear();
            self.buffers.push(buffer);
        }
    }
    
    /// Clear all buffers in the pool
    pub fn clear(&mut self) {
        self.buffers.clear();
    }
    
    /// Get pool efficiency statistics
    pub fn stats(&self) -> (usize, usize, f32) {
        let total = self.hits + self.misses;
        let hit_rate = if total > 0 {
            self.hits as f32 / total as f32
        } else {
            0.0
        };
        
        (self.hits, self.misses, hit_rate)
    }
}

/// Switch from Vec<i16> to InlineVec<i16, 512> for temporary buffers
/// 
/// This is a helper function to optimize memory usage by using stack
/// allocation for small buffers.
pub fn optimize_temp_buffers<F, R>(func: F) -> R
where
    F: FnOnce(&mut I16BufferPool) -> R,
{
    let mut pool = I16BufferPool::new(8);
    let result = func(&mut pool);
    
    // Log efficiency stats in debug mode
    #[cfg(debug_assertions)]
    {
        let (hits, misses, hit_rate) = pool.stats();
        tracing::debug!(
            "Buffer pool stats: {} hits, {} misses, {:.1}% hit rate",
            hits,
            misses,
            hit_rate * 100.0
        );
    }
    
    result
}
