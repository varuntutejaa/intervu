import { FileUploadGroup, InputGroup, SelectGroup, TextAreaGroup } from "./AuroraLayout";

export const EXPERIENCE_OPTIONS = [
  { value: "0-1", label: "0–1 years" },
  { value: "1-3", label: "1–3 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "5-10", label: "5–10 years" },
  { value: "10+", label: "10+ years" },
];

export const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "500+", label: "500+ employees" },
];

export type CandidateFields = {
  desiredRole: string;
  location: string;
  experience: string;
  portfolioUrl: string;
  skills: string;
  bio: string;
};

export type RecruiterFields = {
  companyName: string;
  jobTitle: string;
  companyWebsite: string;
  companySize: string;
  industry: string;
  companyBio: string;
};

export const EMPTY_CANDIDATE: CandidateFields = {
  desiredRole: "",
  location: "",
  experience: "",
  portfolioUrl: "",
  skills: "",
  bio: "",
};

export const EMPTY_RECRUITER: RecruiterFields = {
  companyName: "",
  jobTitle: "",
  companyWebsite: "",
  companySize: "",
  industry: "",
  companyBio: "",
};

export function CandidateProfileFields({
  values,
  onChange,
  resume,
  onResumeChange,
  existingResumeFilename,
}: {
  values: CandidateFields;
  onChange: (patch: Partial<CandidateFields>) => void;
  resume: File | null;
  onResumeChange: (file: File | null) => void;
  existingResumeFilename?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <InputGroup
          label="Desired role"
          placeholder="Backend Engineer"
          type="text"
          value={values.desiredRole}
          onChange={(desiredRole) => onChange({ desiredRole })}
        />
        <InputGroup
          label="Location"
          placeholder="San Francisco, CA"
          type="text"
          value={values.location}
          onChange={(location) => onChange({ location })}
        />
      </div>

      <SelectGroup
        label="Years of experience"
        placeholder="Select a range"
        value={values.experience}
        onChange={(experience) => onChange({ experience })}
        options={EXPERIENCE_OPTIONS}
      />

      <InputGroup
        label="Portfolio / LinkedIn URL"
        placeholder="https://linkedin.com/in/you"
        type="url"
        value={values.portfolioUrl}
        onChange={(portfolioUrl) => onChange({ portfolioUrl })}
      />

      <InputGroup
        label="Key skills"
        placeholder="React, TypeScript, Node.js"
        type="text"
        value={values.skills}
        onChange={(skills) => onChange({ skills })}
      />

      <TextAreaGroup
        label="Short bio"
        placeholder="A couple sentences about your experience and what you're looking for."
        value={values.bio}
        onChange={(bio) => onChange({ bio })}
      />

      <FileUploadGroup
        label="Resume"
        file={resume}
        onChange={onResumeChange}
        accept=".pdf,.doc,.docx"
        existingLabel={existingResumeFilename}
      />
    </>
  );
}

export function RecruiterProfileFields({
  values,
  onChange,
  companyLogo,
  onCompanyLogoChange,
  existingCompanyLogoFilename,
}: {
  values: RecruiterFields;
  onChange: (patch: Partial<RecruiterFields>) => void;
  companyLogo: File | null;
  onCompanyLogoChange: (file: File | null) => void;
  existingCompanyLogoFilename?: string;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <InputGroup
          label="Company name"
          placeholder="Northwind"
          type="text"
          value={values.companyName}
          onChange={(companyName) => onChange({ companyName })}
        />
        <InputGroup
          label="Your job title"
          placeholder="Head of Talent"
          type="text"
          value={values.jobTitle}
          onChange={(jobTitle) => onChange({ jobTitle })}
        />
      </div>

      <InputGroup
        label="Company website"
        placeholder="https://northwind.com"
        type="url"
        value={values.companyWebsite}
        onChange={(companyWebsite) => onChange({ companyWebsite })}
      />

      <div className="grid grid-cols-2 gap-4">
        <SelectGroup
          label="Company size"
          placeholder="Select a size"
          value={values.companySize}
          onChange={(companySize) => onChange({ companySize })}
          options={COMPANY_SIZE_OPTIONS}
        />
        <InputGroup
          label="Industry"
          placeholder="Software"
          type="text"
          value={values.industry}
          onChange={(industry) => onChange({ industry })}
        />
      </div>

      <TextAreaGroup
        label="Company description"
        placeholder="A couple sentences about what your company does."
        value={values.companyBio}
        onChange={(companyBio) => onChange({ companyBio })}
      />

      <FileUploadGroup
        label="Company logo"
        file={companyLogo}
        onChange={onCompanyLogoChange}
        accept="image/*"
        existingLabel={existingCompanyLogoFilename}
      />
    </>
  );
}
