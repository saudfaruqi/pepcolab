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

if (!$name || !$email || !$subject || !$message) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Please complete all required fields."
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid email address."
    ]);
    exit;
}

$to = "support@pepcolab.com";

$emailSubject = "Website Contact: " . $subject;

$emailBody = "
New contact form submission

Name: {$name}
Email: {$email}
Company: {$company}

Subject:
{$subject}

Message:
{$message}
";

$headers = [
    "From: PepcoLab Website <noreply@yourdomain.com>",
    "Reply-To: {$email}",
    "Content-Type: text/plain; charset=UTF-8"
];

$mailSent = mail(
    $to,
    $emailSubject,
    $emailBody,
    implode("\r\n", $headers)
);

if (!$mailSent) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to send email."
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Message sent successfully."
]);