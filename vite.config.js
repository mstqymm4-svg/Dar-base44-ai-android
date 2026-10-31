import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function otpApiPlugin() {
  const otpStore = new Map();

  return {
    name: 'otp-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        if (req.method === 'POST' && (url === '/api/send-otp' || url === '/send-otp')) {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const { email } = JSON.parse(body || '{}');
              const cleanEmail = (email || '').trim().toLowerCase();
              if (!cleanEmail) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'يرجى إدخال البريد الإلكتروني' }));
                return;
              }

              const code = Math.floor(100000 + Math.random() * 900000).toString();
              otpStore.set(cleanEmail, {
                code,
                expiresAt: Date.now() + 10 * 60 * 1000,
                attempts: 5,
              });

              console.log(`[OTP] Generated verification code for ${cleanEmail}: ${code}`);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                message: `تم إرسال رمز التحقق بنجاح إلى ${cleanEmail}`,
                code,
              }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'بيانات غير صالحة' }));
            }
          });
          return;
        }

        if (req.method === 'POST' && (url === '/api/verify-otp' || url === '/verify-otp')) {
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const { email, otp } = JSON.parse(body || '{}');
              const cleanEmail = (email || '').trim().toLowerCase();
              const cleanOtp = String(otp || '').trim();
              const record = otpStore.get(cleanEmail);
              const now = Date.now();

              res.setHeader('Content-Type', 'application/json');
              if (!record || now > record.expiresAt) {
                otpStore.delete(cleanEmail);
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد' }));
                return;
              }

              if (record.code !== cleanOtp) {
                record.attempts -= 1;
                res.statusCode = 400;
                res.end(JSON.stringify({
                  success: false,
                  error: `رمز التحقق غير صحيح، المحاولات المتبقية: ${record.attempts}`,
                  remainingAttempts: record.attempts,
                }));
                return;
              }

              otpStore.delete(cleanEmail);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: 'تم التحقق من الرمز بنجاح ✓' }));
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'بيانات غير صالحة' }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  plugins: [
    otpApiPlugin(),
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});
