/**
 * Verify SMTP credentials (EMAIL_USER / EMAIL_PASS / EMAIL_HOST / EMAIL_PORT).
 *
 * Usage (from backend/):  npm run email:verify
 */
import 'dotenv/config';
import { testEmailConnection } from '../src/services/emailService';

async function main(): Promise<void> {
  const ok = await testEmailConnection();
  // Plain stdout so Git Bash / CI always show a result (Winston can be easy to miss)
  if (ok) {
    console.log('\nSMTP OK — EMAIL_USER / EMAIL_PASS accepted by the mail server.\n');
  } else {
    console.error('\nSMTP FAILED — see error lines above. Fix .env then run again.\n');
    process.exitCode = 1;
  }
}

main();
