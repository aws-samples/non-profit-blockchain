export interface Block {
    caption: string;
    date: Date;
    title: string;
    selected: boolean;
    content: string;
    txCount: number;
    txInBlock: Array<string>;

}
