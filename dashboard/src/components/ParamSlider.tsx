import React, { useState, useEffect, useCallback } from 'react';

interface ParamSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  initialValue: number;
  paramId: string;
  onValueChange?: (value: number) => void;
  debounceTime?: number;
}

/**
 * Component for adjusting parameters with debounced API updates.
 * Supports real-time control of Lyapunov/Barrier parameters with backend updates.
 */
const ParamSlider: React.FC<ParamSliderProps> = ({
  label,
  min,
  max,
  step,
  initialValue,
  paramId,
  onValueChange,
  debounceTime = 100
}) => {
  const [value, setValue] = useState<number>(initialValue);
  const [displayValue, setDisplayValue] = useState<string>(initialValue.toString());
  const [isSending, setIsSending] = useState<boolean>(false);
  const [lastSent, setLastSent] = useState<number | null>(null);
  
  // Debounced API call to update parameter
  const updateParameter = useCallback(
    async (newValue: number) => {
      setIsSending(true);
      try {
        const response = await fetch('/api/v1/koopman/params', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ [paramId]: newValue })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        setLastSent(newValue);
      } catch (error) {
        console.error('Failed to update parameter:', error);
      } finally {
        setIsSending(false);
      }
    },
    [paramId]
  );
  
  // Debounce parameter updates
  useEffect(() => {
    const handler = setTimeout(() => {
      if (value !== lastSent) {
        updateParameter(value);
        if (onValueChange) {
          onValueChange(value);
        }
      }
    }, debounceTime);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, lastSent, updateParameter, onValueChange, debounceTime]);
  
  // Handle slider change
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.target.value);
    setValue(newValue);
    setDisplayValue(newValue.toFixed(step < 1 ? -Math.floor(Math.log10(step)) : 0));
  };
  
  // Handle direct input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(event.target.value);
  };
  
  // Process input on blur
  const handleInputBlur = () => {
    let newValue = parseFloat(displayValue);
    
    if (isNaN(newValue)) {
      newValue = initialValue;
    } else {
      newValue = Math.max(min, Math.min(max, newValue));
    }
    
    setValue(newValue);
    setDisplayValue(newValue.toFixed(step < 1 ? -Math.floor(Math.log10(step)) : 0));
  };
  
  // Handle input keypress (Enter)
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleInputBlur();
    }
  };
  
  // Format number for display with appropriate decimal places
  const getDisplayValue = useCallback((val: number): string => {
    return val.toFixed(step < 1 ? -Math.floor(Math.log10(step)) : 0);
  }, [step]);
  
  return (
    <div className="param-slider" style={{ margin: '10px 0', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleKeyPress}
            min={min}
            max={max}
            step={step}
            style={{
              width: '70px',
              marginLeft: '10px',
              padding: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              textAlign: 'right'
            }}
          />
          {isSending && (
            <div 
              style={{ 
                marginLeft: '10px', 
                width: '10px', 
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ffa500'
              }}
            />
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ marginRight: '10px', fontSize: '0.8rem' }}>{min}</div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          style={{ flex: 1 }}
        />
        <div style={{ marginLeft: '10px', fontSize: '0.8rem' }}>{max}</div>
      </div>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '3px',
          fontSize: '0.7rem',
          color: '#666'
        }}
      >
        <div>Current: {getDisplayValue(value)}</div>
        {lastSent !== null && (
          <div>Last sent: {getDisplayValue(lastSent)}</div>
        )}
      </div>
    </div>
  );
};

export default ParamSlider;
