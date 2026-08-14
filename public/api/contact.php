<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't show errors in output

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

// Always return JSON, even on errors
function sendJsonResponse($success, $message, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        "success" => $success,
        "message" => $message
    ]);
    exit;
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, "Method not allowed", 405);
}

// Get and parse input
$input = file_get_contents("php://input");
if (!$input) {
    sendJsonResponse(false, "No input received", 400);
}

$data = json_decode($input, true);
if (!$data) {
    sendJsonResponse(false, "Invalid JSON input", 400);
}

// Extract and trim values
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$company = trim($data['company'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

// Validate required fields
if (!$name || !$email || !$subject || !$message) {
    sendJsonResponse(false, "Please complete all required fields.", 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJsonResponse(false, "Invalid email address.", 400);
}

// Email configuration
$to = "hello@pepcolab.com";
$emailSubject = "Website Contact: " . $subject;

$emailBody = "
New contact form submission

━━━━━━━━━━━━━━━━━━━━━━━━━
Name:    {$name}
Email:   {$email}
Company: " . ($company ?: 'Not provided') . "
━━━━━━━━━━━━━━━━━━━━━━━━━

Subject:
{$subject}

Message:
{$message}
━━━━━━━━━━━━━━━━━━━━━━━━━
This message was sent from the PepcoLab contact form.
";

// SMTP Configuration from environment or defaults
$smtp_host = getenv('SMTP_HOST') ?: 'smtp.secureserver.net';
$smtp_port = getenv('SMTP_PORT') ?: 587;
$smtp_user = getenv('SMTP_USER') ?: 'hello@pepcolab.com';
$smtp_pass = getenv('SMTP_PASS') ?: 'pepcolab@1';
$smtp_from = getenv('SMTP_FROM') ?: 'hello@pepcolab.com';

// Try sending via SMTP with fsockopen (no external libraries needed)
$mailSent = false;
$errorMessage = '';

// Use PHPMailer if available via Composer autoload
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require_once __DIR__ . '/../../vendor/autoload.php';
    
    if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $smtp_host;
            $mail->SMTPAuth = true;
            $mail->Username = $smtp_user;
            $mail->Password = $smtp_pass;
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $smtp_port;
            $mail->SMTPDebug = 0; // Disable debug output

            $mail->setFrom($smtp_from, 'PepcoLab');
            $mail->addReplyTo($email, $name);
            $mail->addAddress($to);
            $mail->Subject = $emailSubject;
            $mail->Body = $emailBody;

            $mailSent = $mail->send();
        } catch (Exception $e) {
            $errorMessage = $mail->ErrorInfo;
            error_log("PHPMailer Error: " . $mail->ErrorInfo);
        }
    }
}

// Fallback: Try using mail() function
if (!$mailSent) {
    $headers = "From: PepcoLab <{$smtp_from}>\r\n";
    $headers .= "Reply-To: {$email}\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $mailSent = mail($to, $emailSubject, $emailBody, $headers);
    
    if (!$mailSent) {
        error_log("mail() function failed to send email");
    }
}

// If all sending methods failed
if (!$mailSent) {
    // Log the error but return a user-friendly message
    error_log("All email sending methods failed for contact form submission from {$email}");
    
    sendJsonResponse(false, "Unable to send email. Please try again later or contact us directly at hello@pepcolab.com.", 500);
}

// Success
sendJsonResponse(true, "Message sent successfully. We'll get back to you soon.", 200);