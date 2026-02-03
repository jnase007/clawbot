# Email Outreach Skill

Sends personalized marketing emails for ProjectHunter.ai outreach campaigns.

## Features

- **SMTP Integration**: Uses Nodemailer with configurable SMTP (Gmail, SendGrid, etc.)
- **Template System**: Handlebars-based templates with variable substitution
- **Rate Limiting**: Configurable rate limits to avoid spam filters
- **Campaign Management**: Batch sending with progress tracking
- **Logging**: All actions logged to Supabase for analytics

## Configuration

Set these environment variables:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=ProjectHunter.ai <noreply@projecthunter.ai>
EMAIL_RATE_LIMIT=1  # emails per second
```

### Gmail Setup

1. Enable 2FA on your Google account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the app password as `EMAIL_PASS`

## Usage

### Send Single Email

```typescript
import { sendEmail } from './skills/email';

await sendEmail(
  'user@example.com',
  'Check out ProjectHunter.ai!',
  'Hey! We have AI bounties waiting for you...'
);
```

### Run Campaign

```typescript
import { runEmailOutreach } from './skills/email';

// Uses pending contacts from Supabase
const result = await runEmailOutreach('template-uuid', 50);
console.log(`Sent: ${result.sent}, Failed: ${result.failed}`);
```

### Template Variables

Templates support Handlebars variables:

- `{{name}}` - Contact's name
- `{{email}}` - Contact's email
- `{{interest}}` - Custom variable
- Any key passed to `extraVariables`

## Best Practices

1. **Warm up**: Start with low volume (10-20/day), gradually increase
2. **Personalize**: Use dynamic variables for better engagement
3. **Monitor**: Check logs for bounces and adjust
4. **Comply**: Include unsubscribe options, respect opt-outs
