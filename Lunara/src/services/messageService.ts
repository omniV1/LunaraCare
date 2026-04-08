/**
 * @module messageService
 * Singleton service for secure messaging between clients and providers.
 * Covers sending, reading, conversation threading, and unread counts.
 */

import { ApiClient } from '../api/apiClient';
import { Message, SendMessageRequest, PaginatedResponse, QueryParams } from '../types/api';

/**
 * Service for managing messages
 */
export class MessageService {
  private static _instance: MessageService | null = null;
  private readonly api: ApiClient;

  private constructor() {
    this.api = ApiClient.getInstance();
  }

  public static getInstance(): MessageService {
    MessageService._instance ??= new MessageService();
    return MessageService._instance;
  }

  public static clearInstance(): void {
    MessageService._instance = null;
  }

  /**
   * Send a new message
   * @param request - Message request containing recipient and content
   * @returns Created message
   */
  public async sendMessage(request: SendMessageRequest): Promise<Message> {
    return this.api.post<Message>('/messages', request);
  }

  /**
   * Get message by ID
   * @param id - Message ID
   * @returns Message details
   */
  public async getMessage(id: number): Promise<Message> {
    return this.api.get<Message>(`/messages/${id}`);
  }

  /**
   * Get conversation messages with a specific user
   * @param userId - User ID to get conversation with
   * @param params - Query parameters for pagination
   * @returns Paginated list of messages
   */
  public async getConversation(
    userId: number,
    params: QueryParams
  ): Promise<PaginatedResponse<Message>> {
    const queryString = this.buildQueryString(params);
    return this.api.get<PaginatedResponse<Message>>(
      `/messages/conversation/${userId}${queryString}`
    );
  }

  /**
   * Get all conversations for current user
   * @param params - Query parameters for pagination
   * @returns Paginated list of latest messages from each conversation
   */
  public async getConversations(params: QueryParams): Promise<PaginatedResponse<Message>> {
    const queryString = this.buildQueryString(params);
    return this.api.get<PaginatedResponse<Message>>(`/messages/conversations${queryString}`);
  }

  /**
   * Mark message as read
   * @param id - Message ID
   */
  public async markAsRead(id: number): Promise<void> {
    await this.api.post(`/messages/${id}/read`, {});
  }

  /**
   * Mark all messages in a conversation as read
   * @param userId - User ID of the conversation
   */
  public async markConversationAsRead(userId: number): Promise<void> {
    await this.api.post(`/messages/conversation/${userId}/read`, {});
  }

  /**
   * Get unread message count
   * @returns Number of unread messages
   */
  public async getUnreadCount(): Promise<number> {
    const response = await this.api.get<{ count: number }>('/messages/unread/count');
    return response.count;
  }

  /**
   * Delete a message
   * @param id - Message ID
   */
  public async deleteMessage(id: number): Promise<void> {
    await this.api.delete(`/messages/${id}`);
  }

  /**
   * Build query string from parameters
   * @param params - Query parameters
   * @returns Formatted query string
   */
  private buildQueryString(params: QueryParams): string {
    const queryParams = new URLSearchParams();

    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
