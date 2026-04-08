/**
 * @module serviceFactory
 * Centralised factory for creating and caching service singletons.
 * Provides a single entry point for dependency injection and teardown.
 */

import { AppointmentService } from './appointmentService';
import { MessageService } from './messageService';

/**
 * Factory class for managing service instances
 * Handles:
 * - Centralized service creation
 * - Dependency injection
 * - Service lifecycle management
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private appointmentService?: AppointmentService;
  private messageService?: MessageService;

  private constructor() {}

  public static getInstance(): ServiceFactory {
    ServiceFactory.instance ??= new ServiceFactory();
    return ServiceFactory.instance;
  }

  /**
   * Get appointment service
   */
  public getAppointmentService(): AppointmentService {
    this.appointmentService ??= AppointmentService.getInstance();
    return this.appointmentService;
  }

  /**
   * Get message service
   */
  public getMessageService(): MessageService {
    this.messageService ??= MessageService.getInstance();
    return this.messageService;
  }

  /**
   * Clear all service instances
   */
  public clearServices(): void {
    // Clear cached service instances
    // Note: AppointmentService doesn't have clearInstance, so we just clear our reference
    this.appointmentService = undefined;

    // MessageService has clearInstance
    MessageService.clearInstance();
    this.messageService = undefined;
  }
}
