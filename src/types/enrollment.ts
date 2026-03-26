export type EnrollmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Enrollment {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: string;
  licenseType: string;
  pickupAddress: string;
  preferredTime: string;
  experience: string;
  status: EnrollmentStatus;
  submittedAt: string;
}

export type View = "home" | "enroll" | "admin";

export interface EnrollmentFormData {
  name: string;
  email: string;
  phone: string;
  age: string;
  licenseType: string;
  pickupAddress: string;
  preferredTime: string;
  experience: string;
}
