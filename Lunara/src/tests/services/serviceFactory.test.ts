/**
 * ServiceFactory unit tests.
 * Verifies singleton behavior, lazy creation and caching of AppointmentService
 * and MessageService, and clearServices() reset behavior.
 */
import { ServiceFactory } from '../../services/serviceFactory';
import { AppointmentService } from '../../services/appointmentService';
import { MessageService } from '../../services/messageService';

jest.mock('../../services/appointmentService');
jest.mock('../../services/messageService', () => ({
  MessageService: {
    getInstance: jest.fn(),
    clearInstance: jest.fn(),
  },
}));

describe('ServiceFactory', () => {
  let factory: ServiceFactory;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton so each test gets a fresh factory (with fresh cached services)
    (ServiceFactory as unknown as Record<string, unknown>).instance = undefined;
    factory = ServiceFactory.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const a = ServiceFactory.getInstance();
      const b = ServiceFactory.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('getAppointmentService', () => {
    it('should return appointment service instance', () => {
      const mockAppointmentService = {};
      (AppointmentService.getInstance as jest.Mock).mockReturnValue(mockAppointmentService);

      const result = factory.getAppointmentService();

      expect(AppointmentService.getInstance).toHaveBeenCalled();
      expect(result).toBe(mockAppointmentService);
    });

    it('should cache appointment service on second call', () => {
      const mockAppointmentService = {};
      (AppointmentService.getInstance as jest.Mock).mockReturnValue(mockAppointmentService);

      const first = factory.getAppointmentService();
      const second = factory.getAppointmentService();

      expect(first).toBe(second);
      expect(AppointmentService.getInstance).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMessageService', () => {
    it('should return message service instance', () => {
      const mockMessageService = {};
      (MessageService.getInstance as jest.Mock).mockReturnValue(mockMessageService);

      const result = factory.getMessageService();

      expect(MessageService.getInstance).toHaveBeenCalled();
      expect(result).toBe(mockMessageService);
    });

    it('should cache message service on second call', () => {
      const mockMessageService = {};
      (MessageService.getInstance as jest.Mock).mockReturnValue(mockMessageService);

      const first = factory.getMessageService();
      const second = factory.getMessageService();

      expect(first).toBe(second);
      expect(MessageService.getInstance).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearServices', () => {
    it('should clear cached services and call MessageService.clearInstance', () => {
      const mockMessageService = {};
      (MessageService.getInstance as jest.Mock).mockReturnValue(mockMessageService);

      factory.getMessageService();
      factory.clearServices();

      expect(MessageService.clearInstance).toHaveBeenCalled();
      factory.getMessageService();
      expect(MessageService.getInstance).toHaveBeenCalledTimes(2);
    });
  });
});
