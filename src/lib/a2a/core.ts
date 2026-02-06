
export interface A2AContext {
    userId?: string;
    requestId?: string;
    signal?: AbortSignal;
}

export type ToolResult<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: any;
};

export interface Tool<Input = any, Output = any> {
    name: string;
    description: string;
    execute(input: Input, context?: A2AContext): Promise<ToolResult<Output>>;
}

export interface Agent<Input = any, Output = any> {
    name: string;
    description: string;
    run(input: Input, context?: A2AContext): Promise<ToolResult<Output>>;
}
