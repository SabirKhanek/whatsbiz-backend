export interface NewWAMessage {
    chatName: string,
    authorName: string,
    messageContent: string,
    messageId: string,
    messageTimestamp: EpochTimeStamp;
    isContact: boolean;
    messageType: string;
    chatId: string;
}

export interface ClientDisconnectEvent {
    statusCode: number;
    disconnectReason: string;
}

export interface ClientConnectEvent {
    username: string;
    id: string;
}

export interface NewQRgenEvent {
    qr: string;
}