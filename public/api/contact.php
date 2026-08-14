<?php
// public/api/contact.php

// ─── HEADERS ───
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ─── ONLY ALLOW POST ───
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Please use POST."
    ]);
    exit;
}

// ─── GET POST DATA ───
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// If JSON decode fails, try getting from $_POST
if (!$data) {
    $data = $_POST;
}

// ─── SANITIZE INPUT ───
function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

$name = sanitize($data['name'] ?? '');
$email = sanitize($data['email'] ?? '');
$company = sanitize($data['company'] ?? '');
$subject = sanitize($data['subject'] ?? '');
$message = sanitize($data['message'] ?? '');

// ─── VALIDATION ───
$errors = [];

if (empty($name)) {
    $errors[] = "Name is required";
}

if (empty($email)) {
    $errors[] = "Email is required";
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email address";
}

if (empty($subject)) {
    $errors[] = "Subject is required";
}

if (empty($message)) {
    $errors[] = "Message is required";
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Validation failed",
        "errors" => $errors
    ]);
    exit;
}

// ─── LOG THE MESSAGE (for debugging) ───
$logFile = __DIR__ . '/contact_log.txt';
$logEntry = date('Y-m-d H:i:s') . " | " . $email . " | " . $subject . " | " . $name . "\n";
file_put_contents($logFile, $logEntry, FILE_APPEND);

// ─── EMAIL CONFIGURATION ───
$to = "hello@pepcolab.com";
$from = "hello@pepcolab.com";
$replyTo = $email;

$emailSubject = "Website Contact: " . $subject;

// ─── EMAIL BODY (Plain Text) ───
$emailBody = "
╔═══════════════════════════════════════════════════╗
║         NEW CONTACT FORM SUBMISSION              ║
╚═══════════════════════════════════════════════════╝

📋 CONTACT DETAILS
───────────────────────────────────────────────────
Name:     {$name}
Email:    {$email}
Company:  " . ($company ?: "N/A") . "
───────────────────────────────────────────────────

📌 SUBJECT:
{$subject}

───────────────────────────────────────────────────

💬 MESSAGE:
{$message}

───────────────────────────────────────────────────
Sent from: pepcolab.com
Date:      " . date('l, F j, Y \a\t g:i A') . "
───────────────────────────────────────────────────
";

// ─── EMAIL HEADERS ───
$headers = [
    "From: PepcoLab Website <{$from}>",
    "Reply-To: {$replyTo}",
    "X-Mailer: PHP/" . phpversion(),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit"
];

// ─── HTML EMAIL BODY (for email clients that support it) ───
$htmlBody = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; }
        .header { background: #0d0d0d; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
        .content { background: #ffffff; padding: 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
        .field { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
        .field-label { font-weight: 600; color: #666; width: 80px; display: inline-block; }
        .field-value { color: #1a1a1a; }
        .message-box { background: #f8f7f4; padding: 16px; border-radius: 6px; margin: 12px 0; border-left: 3px solid #1a4d8f; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 16px; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>📧 New Contact Form Submission</h1>
    </div>
    <div class='content'>
        <div class='field'>
            <span class='field-label'>Name:</span>
            <span class='field-value'><strong>{$name}</strong></span>
        </div>
        <div class='field'>
            <span class='field-label'>Email:</span>
            <span class='field-value'><a href='mailto:{$email}' style='color: #1a4d8f;'>{$email}</a></span>
        </div>
        " . ($company ? "
        <div class='field'>
            <span class='field-label'>Company:</span>
            <span class='field-value'>{$company}</span>
        </div>
        " : "") . "
        <div class='field'>
            <span class='field-label'>Subject:</span>
            <span class='field-value'><strong>{$subject}</strong></span>
        </div>
        <div class='message-box'>
            <strong>Message:</strong>
            <p style='margin: 8px 0 0 0; white-space: pre-wrap;'>{$message}</p>
        </div>
        <div style='color: #999; font-size: 12px; margin-top: 16px;'>
            Sent from pepcolab.com on " . date('l, F j, Y \a\t g:i A') . "
        </div>
    </div>
    <div class='footer'>
        PepcoLab &bull; Research-grade peptides for laboratory use only
    </div>
</body>
</html>
";

// ─── SEND EMAIL ───
$mailSent = false;
$errorMessage = '';

// Try multiple methods to send email

// Method 1: Standard mail() with plain text
if (!$mailSent) {
    try {
        $mailSent = mail(
            $to,
            $emailSubject,
            $emailBody,
            implode("\r\n", $headers)
        );
        if (!$mailSent) {
            $errorMessage = "mail() function failed";
        }
    } catch (Exception $e) {
        $errorMessage = "mail() exception: " . $e->getMessage();
    }
}

// Method 2: mail() with HTML content and additional headers
if (!$mailSent) {
    try {
        $htmlHeaders = $headers;
        $htmlHeaders[] = "Content-Type: text/html; charset=UTF-8";
        $mailSent = mail(
            $to,
            $emailSubject,
            $htmlBody,
            implode("\r\n", $htmlHeaders)
        );
        if (!$mailSent) {
            $errorMessage = "HTML mail() failed";
        }
    } catch (Exception $e) {
        $errorMessage = "HTML mail() exception: " . $e->getMessage();
    }
}

// Method 3: Using sendmail directly
if (!$mailSent && function_exists('sendmail')) {
    try {
        $sendmail = '/usr/sbin/sendmail -t -i';
        $fp = popen($sendmail, 'w');
        if ($fp) {
            fwrite($fp, "To: {$to}\r\n");
            fwrite($fp, "Subject: {$emailSubject}\r\n");
            fwrite($fp, "From: PepcoLab Website <{$from}>\r\n");
            fwrite($fp, "Reply-To: {$replyTo}\r\n");
            fwrite($fp, "Content-Type: text/plain; charset=UTF-8\r\n");
            fwrite($fp, "\r\n");
            fwrite($fp, $emailBody);
            $mailSent = (pclose($fp) === 0);
        }
    } catch (Exception $e) {
        $errorMessage = "sendmail failed: " . $e->getMessage();
    }
}

// ─── RESPONSE ───
if ($mailSent) {
    // Log success
    $logFile = __DIR__ . '/contact_success.log';
    $logEntry = date('Y-m-d H:i:s') . " | SUCCESS | " . $email . " | " . $subject . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Message sent successfully! We'll get back to you soon."
    ]);
} else {
    // Log failure
    $logFile = __DIR__ . '/contact_error.log';
    $logEntry = date('Y-m-d H:i:s') . " | FAILED | " . $email . " | " . $errorMessage . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND);

    // Still return success to the user (don't reveal email errors)
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Message received! We'll get back to you soon."
    ]);
}