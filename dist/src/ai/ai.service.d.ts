export declare class AiService {
    private get baseUrl();
    private get apiKey();
    private get model();
    private get chatCompletionsUrl();
    chatText(params: {
        system?: string;
        user: string;
    }): Promise<string>;
}
