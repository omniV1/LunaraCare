/**
 * Unit tests for emailService: validateEmailEnvironment, sendEmail (template not found),
 * emailTemplates rendering, testEmailConnection. Nodemailer is mocked.
 */
const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: mockSendMail,
    verify: mockVerify,
  }),
}));

import {
  validateEmailEnvironment,
  sendEmail,
  testEmailConnection,
  emailTemplates,
  type EmailTemplateData,
} from '../../src/services/emailService';

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-pass';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEmailEnvironment', () => {
    it('does not throw when EMAIL_USER and EMAIL_PASS are set', () => {
      expect(() => validateEmailEnvironment()).not.toThrow();
    });

    it('throws when EMAIL_USER is missing', () => {
      delete process.env.EMAIL_USER;
      expect(() => validateEmailEnvironment()).toThrow(
        'Missing required email environment variables'
      );
      expect(() => validateEmailEnvironment()).toThrow('EMAIL_USER');
    });

    it('throws when EMAIL_PASS is missing', () => {
      delete process.env.EMAIL_PASS;
      expect(() => validateEmailEnvironment()).toThrow(
        'Missing required email environment variables'
      );
      expect(() => validateEmailEnvironment()).toThrow('EMAIL_PASS');
    });
  });

  describe('sendEmail', () => {
    it('throws when template is not found', async () => {
      await expect(
        sendEmail({
          to: 'user@example.com',
          template: 'nonexistent',
          data: {},
        })
      ).rejects.toThrow("Email template 'nonexistent' not found");
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('sends email with welcome template when template exists', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'msg-123' });

      const result = await sendEmail({
        to: 'user@example.com',
        template: 'welcome',
        data: { firstName: 'Jane', verificationUrl: 'https://example.com/verify' },
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const [opts] = mockSendMail.mock.calls[0];
      expect(opts.to).toBe('user@example.com');
      expect(opts.subject).toContain('Welcome');
      expect(opts.html).toContain('Jane');
      expect(opts.html).toContain('https://example.com/verify');
      expect(opts.text).toContain('Jane');
      expect(result).toEqual({ messageId: 'msg-123' });
    });
  });

  describe('emailTemplates', () => {
    it('welcome template renders html and text with data', () => {
      const data: EmailTemplateData = {
        firstName: 'Test',
        verificationUrl: 'http://verify.test',
      };
      const html = emailTemplates.welcome.html(data);
      const text = emailTemplates.welcome.text(data);

      expect(html).toContain('Test');
      expect(html).toContain('http://verify.test');
      expect(text).toContain('Test');
      expect(text).toContain('http://verify.test');
    });

    it('password-reset template renders with resetUrl', () => {
      const data: EmailTemplateData = {
        firstName: 'User',
        resetUrl: 'http://reset.test',
      };
      const html = emailTemplates['password-reset'].html(data);
      expect(html).toContain('User');
      expect(html).toContain('http://reset.test');
    });

    it('appointment template renders with appointment fields', () => {
      const data: EmailTemplateData = {
        clientName: 'Client',
        doulaName: 'Doula',
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00',
        appointmentType: 'Check-in',
      };
      const html = emailTemplates.appointment.html(data);
      expect(html).toContain('Client');
      expect(html).toContain('Doula');
      expect(html).toContain('2024-01-15');
      expect(html).toContain('10:00');
      expect(html).toContain('Check-in');
    });
  });

  describe('testEmailConnection', () => {
    it('returns true when transporter.verify resolves', async () => {
      mockVerify.mockResolvedValue(undefined);

      const result = await testEmailConnection();

      expect(mockVerify).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('returns false when transporter.verify rejects', async () => {
      mockVerify.mockRejectedValue(new Error('Connection failed'));

      const result = await testEmailConnection();

      expect(result).toBe(false);
    });
  });
});
