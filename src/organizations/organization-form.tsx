"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createOrganization } from "@/features/organizations/actions";
import { Organization } from "@/types/organizations";

export function OrganizationForm() {
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreateOrganization = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const organization: Organization = await createOrganization(orgName);
      setSuccess(`Organization '${organization.name}' created successfully!`);
      setOrgName("");
    } catch (e) {
      setError("Failed to create organization.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-semibold mb-2">Create Organization</h2>
      <Input
        placeholder="Organization name"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        className="mb-2"
      />
      <Button onClick={handleCreateOrganization} disabled={!orgName || loading}>
        {loading ? "Creating..." : "Create Organization"}
      </Button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-500 mt-2">{success}</div>}
    </div>
  );
}
