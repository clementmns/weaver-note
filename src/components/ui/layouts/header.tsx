"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getOrganizations } from "@/features/organizations/actions";
import { getUserProfile } from "@/features/users/actions";
import { ChevronsUpDown, LogOut, Settings2 } from "lucide-react";
import { logout } from "@/features/auth/actions";

export function Header() {
  const [organizations, setOrganizations] = useState<{ id: string; name: string; profile: string | null }[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string; profile: string | null } | null>(null);
  const [userProfile, setUserProfile] = useState<{ displayName: string; profilePicture: string | null, selectedOrganizationId: string | null } | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await getOrganizations();
        setOrganizations(orgs);
        if (orgs.length > 0) {
            const selected = orgs.find(org => org.id === userProfile?.selectedOrganizationId) || orgs[0];
            setSelectedOrg(selected);
        }
      } catch (error) {
        console.error("Failed to fetch organizations", error);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };

    fetchUserProfile();
    fetchOrganizations();
  }, []);

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-bold">Weaver Note</h1>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              {selectedOrg?.profile ? (
                <img
                  src={`data:image/png;base64,${selectedOrg.profile}`}
                  alt={selectedOrg.name}
                  className="w-8 h-8 rounded-md object-cover inline-block mr-2"
                />
              ) : (
                <span className="w-8 h-8 rounded-md bg-gray-300 flex items-center justify-center text-white font-bold mr-2">
                  {selectedOrg?.name.charAt(0).toUpperCase()}
                </span>
              )}
              {selectedOrg ? selectedOrg.name : "Select Organization"}
              <ChevronsUpDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {organizations.map((org) => (
              <DropdownMenuItem key={org.id} onClick={() => setSelectedOrg(org)}>
                {org.profile ? (
                  <img
                    src={`data:image/png;base64,${org.profile}`}
                    alt={org.name}
                    className="w-8 h-8 rounded-md object-cover inline-block mr-2"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-md bg-gray-300 flex items-center justify-center text-white font-bold mr-2">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                )}
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              {userProfile?.profilePicture ? (
                <img
                  src={`data:image/png;base64,${userProfile.profilePicture}`}
                  alt={userProfile.displayName}
                  className="w-8 h-8 rounded-full object-cover inline-block mr-2"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold mr-2">
                  {userProfile?.displayName.charAt(0).toUpperCase()}
                </span>
              )}
              {userProfile ? userProfile.displayName : "Profile"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem><Settings2 />Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={logout}><LogOut />Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
