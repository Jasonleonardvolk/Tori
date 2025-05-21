// Type declarations for JSZip
declare module 'jszip' {
  class JSZip {
    /**
     * Add a file to the zip file
     * @param path The path to the file within the zip
     * @param data The content of the file
     * @returns The JSZip instance
     */
    file(path: string, data: Uint8Array | string | ArrayBuffer | Blob): JSZip;

    /**
     * Generate the complete zip file
     * @param options Options for file generation
     * @returns A Promise resolving with the generated zip file
     */
    generateAsync(options: { type: 'blob' | 'arraybuffer' | 'base64' | 'text' | 'binarystring' | 'uint8array' | 'nodebuffer' }): Promise<any>;
    
    /**
     * Process each file from the zip file
     * @param callback Function to process the files
     */
    forEach(callback: (relativePath: string, file: ZipObject) => void): void;
  }

  export interface ZipObject {
    name: string;
    dir: boolean;
    date: Date;
    comment: string;
    unixPermissions: number;
    dosPermissions: number;
    async(type: string): Promise<any>;
  }
}
