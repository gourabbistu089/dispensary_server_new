export const presciptionEmailTemplate = ({patientName, doctorName}) => {

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Patient Prescription</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            background-color: #1e3a8a;
            color: #ffffff;
            padding: 15px;
            font-size: 22px;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 20px;
            color: #333333;
            line-height: 1.6;
        }
        .footer {
            text-align: center;
            font-size: 14px;
            color: #777777;
            padding: 10px;
        }
        .button {
            display: inline-block;
            background-color: #1e3a8a;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            Patient Prescription
        </div>
        <div class="content">
            <p>Dear ${patientName},</p>
            <p>Your prescription from <strong>Dr. ${doctorName}</strong> is attached to this email.</p>

            <p>Please download and review your prescription. If you have any questions, feel free to reach out to your doctor.</p>

            <p>Wishing you a speedy recovery!</p>

        </div>

        <div class="footer">
            &copy; 2025 NIT Jamshedpur. All rights reserved.
        </div>
    </div>
</body>
</html>
`;
}
