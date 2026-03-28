import { ApiClient } from '../../api/apiClient';

// Mock the entire ApiClient module
jest.mock('../../api/apiClient', () => {
  return {
    ApiClient: {
      getInstance: jest.fn(),
    },
  };
});

// Import after mocking
import { MessageService } from '../../services/messageService';
import { Message, SendMessageRequest, QueryParams } from '../../types/api';

describe('MessageService', () => {
  let messageService: MessageService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<ApiClient>;

    (ApiClient.getInstance as jest.Mock).mockReturnValue(mockApiClient);

    // Reset the singleton instance before each test
    MessageService.clearInstance();

    // Get fresh instance
    messageService = MessageService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MessageService.getInstance();
      const instance2 = MessageService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('sendMessage', () => {
    it('should send a new message', async () => {
      const request: SendMessageRequest = {
        recipientId: '2',
        content: 'Hello, World!',
      };
      const mockMessage: Message = {
        id: '1',
        senderId: '1',
        recipientId: '2',
        content: 'Hello, World!',
        read: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockApiClient.post.mockResolvedValue(mockMessage);

      const result = await messageService.sendMessage(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/messages', request);
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getMessage', () => {
    it('should get message by ID', async () => {
      const mockMessage: Message = {
        id: '1',
        senderId: '1',
        recipientId: '2',
        content: 'Test message',
        read: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      mockApiClient.get.mockResolvedValue(mockMessage);

      const result = await messageService.getMessage(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/messages/1');
      expect(result).toEqual(mockMessage);
    });
  });

  describe('getConversation', () => {
    it('should get conversation with a user', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            senderId: '1',
            recipientId: '2',
            content: 'Message 1',
            read: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params: QueryParams = { page: 1, pageSize: 10 };
      const result = await messageService.getConversation(2, params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/messages/conversation/2?page=1&pageSize=10');
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty query params', async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await messageService.getConversation(2, {});

      expect(mockApiClient.get).toHaveBeenCalledWith('/messages/conversation/2');
      expect(result).toEqual(mockResponse);
    });

    it('should handle all query params', async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 2, pageSize: 5, total: 0, totalPages: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params: QueryParams = {
        page: 2,
        pageSize: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: 'test',
      };
      const result = await messageService.getConversation(2, params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/messages/conversation/2?page=2&pageSize=5&sortBy=createdAt&sortOrder=desc&search=test'
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getConversations', () => {
    it('should get all conversations', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            senderId: '2',
            recipientId: '1',
            content: 'Latest message',
            read: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1,
        },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params: QueryParams = { page: 1, pageSize: 10 };
      const result = await messageService.getConversations(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/messages/conversations?page=1&pageSize=10');
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty query params', async () => {
      const mockResponse = {
        data: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await messageService.getConversations({});

      expect(mockApiClient.get).toHaveBeenCalledWith('/messages/conversations');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      mockApiClient.post.mockResolvedValue(undefined);

      await messageService.markAsRead(1);

      expect(mockApiClient.post).toHaveBeenCalledWith('/messages/1/read', {});
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all messages in conversation as read', async () => {
      mockApiClient.post.mockResolvedValue(undefined);

      await messageService.markConversationAsRead(2);

      expect(mockApiClient.post).toHaveBeenCalledWith('/messages/conversation/2/read', {});
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread message count', async () => {
      mockApiClient.get.mockResolvedValue({ count: 5 });

      const result = await messageService.getUnreadCount();

      expect(mockApiClient.get).toHaveBeenCalledWith('/messages/unread/count');
      expect(result).toBe(5);
    });

    it('should handle zero unread messages', async () => {
      mockApiClient.get.mockResolvedValue({ count: 0 });

      const result = await messageService.getUnreadCount();

      expect(result).toBe(0);
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await messageService.deleteMessage(1);

      expect(mockApiClient.delete).toHaveBeenCalledWith('/messages/1');
    });
  });

  describe('buildQueryString', () => {
    it('should build query string with all params', () => {
      // Test by calling getConversations and checking the URL
      mockApiClient.get.mockResolvedValue({ data: [], pagination: {} });

      const params: QueryParams = {
        page: 3,
        pageSize: 20,
        sortBy: 'updatedAt',
        sortOrder: 'asc',
        search: 'query',
      };
      messageService.getConversations(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/messages/conversations?page=3&pageSize=20&sortBy=updatedAt&sortOrder=asc&search=query'
      );
    });

    it('should build query string with partial params', () => {
      mockApiClient.get.mockResolvedValue({ data: [], pagination: {} });

      const params: QueryParams = {
        page: 1,
        sortBy: 'createdAt',
      };
      messageService.getConversations(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/messages/conversations?page=1&sortBy=createdAt'
      );
    });

    it('should return empty string for no params', () => {
      mockApiClient.get.mockResolvedValue({ data: [], pagination: {} });

      messageService.getConversations({});

      expect(mockApiClient.get).toHaveBeenCalledWith('/messages/conversations');
    });
  });
});
