export enum Status {
  Completed = "Completed",
  InProgress = "In Progress",
  NoProgress = "No Progress",
}



export interface Sheet1Data { // Chapter Completion
  [key: string]: any;
  "Name": string;
  "Email": string;
}

export interface Sheet2Data { // Monthly Assessment
  [key: string]: any;
  "Name": string;
  "Email": string;
}

export interface Sheet3Data { // OCS Attendance
  [key: string]: any;
  "Name": string;
  "Email"?: string;
}


export interface Candidate {
  id: string;
  cardNumber: number;
  name: string;
  email: string;
  phone?: string;
  chapterCompletion: string;
  marksObtained: number;
  maxMarks: number;
  skippedQuestions: number;
  status: Status;
  ocs1Status: string;
  ocs2Status: string;
}

export interface StatusThresholds {
    noProgress: number;
    inProgress: number;
}