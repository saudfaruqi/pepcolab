<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$company = trim($data['company'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');

// Validate required fields
if (!$name || !$email || !$subject || !$message) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please complete all required fields."
    ]);
    exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email address."
    ]);
    exit;
}

$to = "hello@pepcolab.com";
$emailSubject = "Website Contact: " . $subject;

$emailBody = "New contact form submission\n\n" .
    "Name: {$name}\n" .
    "Email: {$email}\n" .
    "Company: " . ($company ?: "N/A") . "\n\n" .
    "Subject:\n{$subject}\n\n" .
    "Message:\n{$message}\n";

$headers = [
    "From: PepcoLab Website <noreply@pepcolab.com>",
    "Reply-To: {$email}",
    "Content-Type: text/plain; charset=UTF-8"
];

// Try multiple mail methods
$mailSent = false;

// Method 1: Standard mail()
$mailSent = mail(
    $to,
    $emailSubject,
    $emailBody,
    implode("\r\n", $headers)
);

// Method 2: If mail() fails, try using sendmail directly (optional)
if (!$mailSent && function_exists('sendmail')) {
    // Fallback to sendmail
    $mailSent = mail(
        $to,
        $emailSubject,
        $emailBody,
        implode("\r\n", $headers),
        "-f noreply@pepcolab.com"
    );
}

if (!$mailSent) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to send email. Please try again later."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Message sent successfully."
]);