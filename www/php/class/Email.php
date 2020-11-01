<?php
require_once(dirname(__FILE__).'/../../php/lib/PHPMailer/PHPMailerAutoload.php');
require_once(dirname(__FILE__).'/Templates.php');
// require(dirname(__FILE__).'/../lib/PHPMailer/src/PHPMailer.php');
// require(dirname(__FILE__).'/../lib/PHPMailer/src/SMTP.php');
// require(dirname(__FILE__).'/../lib/PHPMailer/src/Exception.php');
// use PHPMailer\PHPMailer\PHPMailer;

class Email{
	public $mail;
	public $from;
	public $replyto;
	public $to;
	public $subject;
	public $message;
	public $isHTML;

	// Basic constructor to send message
	public function __construct($to, $sub = "No Subject", $msg = "No Message", $isHTML = false, $BCC = true, $errors = false, $conf = true){
		$this->mail = new PHPMailer($errors);
		if($conf){
			$this->mail->From = "noreply@educatorsabroad.org";
			$this->mail->FromName = "Educators Abroad Server";
			//$this->mail->addReplyTo = "no-reply@educatorsabroad.org";
			$this->mail->isSMTP();
			$this->mail->Host = 'node.educatorsabroad.org' ;// .";localhost";
			$this->mail->SMTPAuth = true;
			$this->mail->Username = 'noreply@educatorsabroad.org';
			$this->mail->Password = 'Pa$$w0rdEA1234';
		}
		if($BCC) $this->mail->AddBCC('bcc@educatorsabroad.org');
		$this->mail->SMTPSecure = 'tls';//'ssl';
		$this->mail->Port = 587;
		$this->mail->SMTPOptions = array(
			'ssl' => array(
				'verify_peer' => false,
				'verify_peer_name' => false,
				'allow_self_signed' => true
			),
			'tls' => array(
				'verify_peer' => false,
				'verify_peer_name' => false,
				'allow_self_signed' => true
			),
		);
		$this->isHTML = $isHTML;

		$this->to = $to;
		$this->subject = $sub;
		$this->message = $msg;
	}

	// Send using template and data.
	public function send($templateName = null, $data = null){
		$to = $this->to;
		$subject = $this->subject;
		$message = $this->message;
		if($templateName != null && Templates::haveTemplate($templateName)){
			$template = Templates::getTemplate($templateName);
			if(isset($template['subject'])) $subject = $template['subject'];
			if(isset($template['message'])) $message = $template['message'];
		}
		if($data != null){
			if(isset($data['to'])) $to = $data['to'];
			foreach(array_keys($data) as $key){
				$message = str_replace("{{".$key."}}", $data[$key], $message);
			}
		}
		if(isset($user)){
			foreach(array_keys($user) as $key){
				$message = str_replace("{{".$key."}}", $user[$key], $message);
			}
		}
		$message = preg_replace('/\{\{.*\}\}/', "", $message);

		$this->mail->addAddress($to);
		$this->mail->isHTML(true);
		$this->mail->Subject = $subject;
		$this->mail->Body	= "<html><body>$message</body></html>";
		$this->mail->AltBody = htmlentities($message);
		// $this->mail->isHTML($this->isHTML);
		//$this->mail->addCC('cc@example.com'); //$this->mail->addBCC('bcc@example.com');

		//$this->mail->WordWrap = 50; //$this->mail->addAttachment('/var/tmp/file.tar.gz');
		//$this->mail->addAttachment('/tmp/image.jpg', 'new.jpg');

		return $this->mail->send();
	}

	public static function verifyEmail($toemail, $fromemail = 'no-reply@educatorsabroad.org', $getdetails = false){
		// Get the domain of the email recipient
		$email_arr = explode('@', $toemail);
		$domain = array_slice($email_arr, -1);
		$domain = $domain[0];

		// Trim [ and ] from beginning and end of domain string, respectively
		$domain = ltrim($domain, '[');
		$domain = rtrim($domain, ']');
		$details = '';
		$code = 'Fail';

		if ('IPv6:' == substr($domain, 0, strlen('IPv6:'))) {
			$domain = substr($domain, strlen('IPv6') + 1);
		}

		$mxhosts = array();
			// Check if the domain has an IP address assigned to it
		if (filter_var($domain, FILTER_VALIDATE_IP)) {
			$mx_ip = $domain;
		} else {
			// If no IP assigned, get the MX records for the host name
			getmxrr($domain, $mxhosts, $mxweight);
		}

		if (!empty($mxhosts)) {
			$mx_ip = $mxhosts[array_search(min($mxweight), $mxhosts)];
		} else {
			// If MX records not found, get the A DNS records for the host
			if (filter_var($domain, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
				$record_a = dns_get_record($domain, DNS_A);
				 // else get the AAAA IPv6 address record
			} elseif (filter_var($domain, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
				$record_a = dns_get_record($domain, DNS_AAAA);
			}

			if (!empty($record_a)) {
				$mx_ip = $record_a[0]['ip'];
			} else {
				// Exit the program if no MX records are found for the domain host
				$result = 'invalid';
				$details .= 'No suitable MX records found.';

				return ((true == $getdetails) ? [
					'result'=>$result,
					'details'=>$details,
					'code'=>'NoMX'
				] : 'NoMX');
			}
		}

		// Open a socket connection with the hostname, smtp port 25
		$connect = @fsockopen($mx_ip, 25);

		if ($connect) {

			// Initiate the Mail Sending SMTP transaction
			if (preg_match('/^220/i', $out = fgets($connect, 1024))) {

				// Send the HELO command to the SMTP server
				fputs($connect, "HELO $mx_ip\r\n");
				$out = fgets($connect, 1024);

				// Send an SMTP Mail command from the sender's email address
				fputs($connect, "MAIL FROM: <$fromemail>\r\n");
				$from = '220';
				while(preg_match('/^220/i', $from)){
					$from = fgets($connect, 1024);
				}
				$details .= $from."\n";

				// Send the SCPT command with the recepient's email address
				fputs($connect, "RCPT TO: <$toemail>\r\n");
				$to = fgets($connect, 1024);
				$details .= $to."\n";
				$code = substr($to,0,3);

				// Close the socket connection with QUIT command to the SMTP server
				fputs($connect, 'QUIT');
				fclose($connect);

				// The expected response is 250 if the email is valid
				if (!preg_match('/^250/i', $from) || !preg_match('/^250/i', $to)) {
					$result = 'invalid';
				} else {
					$result = 'valid';
				}
				$code = substr($to,0,3);
			}
		} else {
			$result = 'invalid';
			$details .= 'Could not connect to server';
		}
		if ($getdetails) {
			return array('result'=>$result, 'details'=>$details, 'code'=>$code);
		} else {
			return $code;
		}
	}
}
?>