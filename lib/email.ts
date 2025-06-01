import * as React from 'react';
import { Html } from '@react-email/html';
import { Button } from '@react-email/button';
import { Text } from '@react-email/text';
import { Section } from '@react-email/section';

interface EmailProps {
  url: string;
}

// Example email
export function Email({ url }: EmailProps) {
  return React.createElement(
    Html,
    { lang: 'en' },
    React.createElement(
      Section,
      { style: { padding: '20px', textAlign: 'center' } },
      React.createElement(
        Text,
        { style: { fontSize: '20px', color: '#333' } },
        'Thanks for joining our waitlist!'
      ),
      React.createElement(
        Text,
        { style: { color: '#666' } },
        "We'll keep you updated on our progress and let you know when we launch."
      ),
      React.createElement(
        Button,
        {
          href: url,
          style: {
            background: '#3b82f6',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '6px',
            textDecoration: 'none',
            marginTop: '16px',
          },
        },
        'Visit Our Website'
      )
    )
  );
}
