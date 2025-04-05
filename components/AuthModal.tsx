"use client";

import { useContext, useState } from "react";
import { useStytch } from "@stytch/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { X } from "lucide-react";
import { authContext } from "@/app/authLayout";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const stytch = useStytch();
  const { loggingOff } = useContext(authContext);
  // Authentication states
  const [methodId, setMethodId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  // Reset form state when closing modal
  const handleClose = () => {
    // Reset all state
    setMethodId(null);
    setEmail("");
    setPhoneNumber("");
    setCode("");
    setError(null);
    setShowCodeInput(false);
    setIsLoading(false);

    // Call the parent's onClose
    onClose();
  };

  // Handle sending email OTP
  const handleSendEmailOTP = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await stytch.otps.email.loginOrCreate(email, {
        expiration_minutes: 10,
      });

      setMethodId(response.method_id);
      setShowCodeInput(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email OTP");
      console.error("Error sending email OTP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending SMS OTP
  const handleSendSmsOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+1${phoneNumber.replace(/[^0-9]/g, "")}`;

      const response = await stytch.otps.sms.loginOrCreate(formattedPhone, {
        expiration_minutes: 10,
      });

      setMethodId(response.method_id);
      setShowCodeInput(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send SMS OTP");
      console.error("Error sending SMS OTP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verifying OTP code
  const handleVerifyOTP = async () => {
    if (!code || !methodId) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await stytch.otps.authenticate(code, methodId, {
        session_duration_minutes: 60,
      });

      // Authentication successful
      setError(null);

      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close the modal
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid verification code"
      );
      console.error("Error verifying OTP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form to try a different method
  const handleBack = () => {
    setShowCodeInput(false);
    setMethodId(null);
    setCode("");
    setError(null);
  };

  return (
    <Modal isOpen={isOpen && !loggingOff} onClose={handleClose} title="Sign In">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={handleClose}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mt-4 space-y-6">
        {error && (
          <Alert
            variant="destructive"
            className="bg-red-500/10 border-red-500/30"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showCodeInput ? (
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendEmailOTP}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send verification code"}
              </Button>
            </TabsContent>

            <TabsContent value="phone" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Input
                  type="tel"
                  placeholder="Phone number (e.g. +1 555-123-4567)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendSmsOTP}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send verification code"}
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="remember"
                checked={rememberDevice}
                onCheckedChange={(checked) =>
                  setRememberDevice(checked === true)
                }
              />
              <label
                htmlFor="remember"
                className="text-sm text-gray-300 cursor-pointer"
              >
                Remember this device
              </label>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyOTP}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Verifying..." : "Verify code"}
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </Modal>
  );
};
