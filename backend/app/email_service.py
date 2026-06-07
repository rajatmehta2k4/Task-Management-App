# email_service.py — Sends emails using Gmail's SMTP server
# SMTP = Simple Mail Transfer Protocol (the standard way to send email)

import smtplib  # Python's built-in email library
import os
from email.mime.multipart import MIMEMultipart  # For emails with multiple parts (HTML + plain text)
from email.mime.text import MIMEText             # For the text content of the email

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Sends an HTML email using Gmail.
    
    Parameters:
    - to_email: recipient's email address
    - subject: email subject line
    - html_body: HTML content of the email
    
    Returns True if sent successfully, False if it failed.
    
    SETUP REQUIRED:
    1. Enable 2-Factor Authentication on your Gmail account
    2. Go to Google Account > Security > App Passwords
    3. Generate a password for "Mail" on "Other device"
    4. Use that 16-character password as GMAIL_APP_PASSWORD
    """
    
    sender_email = os.environ.get('GMAIL_SENDER_EMAIL')
    app_password = os.environ.get('GMAIL_APP_PASSWORD')
    
    if not sender_email or not app_password:
        print("Warning: Gmail credentials not configured. Email not sent.")
        return False
    
    try:
        # Create email container (MIMEMultipart allows both HTML and plain text)
        message = MIMEMultipart('alternative')
        message['Subject'] = subject
        message['From'] = sender_email
        message['To'] = to_email
        
        # Plain text version (fallback for email clients that don't support HTML)
        # Strip HTML tags for a simple plain text version
        plain_text = html_body.replace('<br>', '\n').replace('<br/>', '\n')
        # This is a simple approach; a library like beautifulsoup4 would be more thorough
        
        # Attach both versions; email client picks which to display
        part1 = MIMEText(plain_text, 'plain')
        part2 = MIMEText(html_body, 'html')
        message.attach(part1)
        message.attach(part2)
        
        # Connect to Gmail's SMTP server
        # Port 587 with TLS (Transport Layer Security) is the secure standard
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.ehlo()       # Identify ourselves to the server
            server.starttls()   # Upgrade connection to encrypted TLS
            server.ehlo()       # Re-identify after encryption
            server.login(sender_email, app_password)  # Authenticate
            server.sendmail(sender_email, to_email, message.as_string())
        
        print(f"Email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print("Gmail authentication failed. Check GMAIL_SENDER_EMAIL and GMAIL_APP_PASSWORD")
        return False
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False


def send_task_assigned_email(assignee_email: str, assignee_name: str, task_title: str, 
                              assigned_by: str, task_description: str = '') -> bool:
    """
    Sends an email when a task is assigned to someone.
    """
    subject = f"📋 New Task Assigned: {task_title}"
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4F46E5; padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Task Assigned</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 16px;">
                Hi <strong>{assignee_name}</strong>,
            </p>
            
            <p style="color: #374151;">
                <strong>{assigned_by}</strong> has assigned you a new task:
            </p>
            
            <div style="background: white; border-left: 4px solid #4F46E5; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 18px;">{task_title}</h2>
                {f'<p style="color: #6b7280; margin: 0;">{task_description}</p>' if task_description else ''}
            </div>
            
            <p style="color: #374151;">
                Log in to view the full task details and update its status.
            </p>
            
            <a href="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard" 
               style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                      border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                View Task →
            </a>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            Task Manager App
        </p>
    </div>
    """
    
    return send_email(assignee_email, subject, html_body)


def send_task_completed_email(creator_email: str, creator_name: str, task_title: str,
                               completed_by: str) -> bool:
    """
    Sends an email to the task creator when someone marks a task as completed.
    """
    subject = f"✅ Task Completed: {task_title}"
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #059669; padding: 30px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Task Completed!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 16px;">
                Hi <strong>{creator_name}</strong>,
            </p>
            
            <p style="color: #374151;">
                Great news! <strong>{completed_by}</strong> has marked the following task as complete:
            </p>
            
            <div style="background: white; border-left: 4px solid #059669; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <h2 style="color: #1f2937; margin: 0; font-size: 18px;">{task_title}</h2>
            </div>
            
            <a href="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard"
               style="display: inline-block; background: #059669; color: white; padding: 12px 24px;
                      border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                View All Tasks →
            </a>
        </div>
    </div>
    """
    
    return send_email(creator_email, subject, html_body)