export interface IFileBase {
    filename?: string;
    mime?: string;
    size: number;
    chuncksize?: number;
}

export interface IFileStats extends IFileBase {
    type: "single" | "multiple";
}

export interface IFileHeader extends IFileBase {
    chunks: string[];
    extends?: { [key: string]: any };
}

export interface IFileTransactionData extends IFileBase {
    data: string;
}

export interface IFileUploadedResult {
    key: string;
    filename: string;
    mime: string;
    size: number;
}
