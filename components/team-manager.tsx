"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { X, Plus, Users, Crown, Shield, User, Copy, UserPlus, Sparkles } from "lucide-react"

interface Team {
  id: string
  name: string
  description: string
  owner_id: string
  invite_code: string
  created_at: string
  member_count?: number
}

interface TeamMember {
  id: string
  user_id: string
  role: "owner" | "admin" | "member"
  joined_at: string
  users: {
    email: string
    full_name: string
  }
}

interface TeamManagerProps {
  onClose: () => void
  onSuccess: () => void
}

export function TeamManager({ onClose, onSuccess }: TeamManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [newTeamName, setNewTeamName] = useState("")
  const [newTeamDescription, setNewTeamDescription] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user) {
      fetchTeams()
    }
  }, [user])

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select(`
        *,
        team_members!inner(
          user_id,
          role
        )
      `)
        .eq("team_members.user_id", user?.id)

      if (error) throw error

      // Count members for each team
      const teamsWithCount = await Promise.all(
        (data || []).map(async (team) => {
          const { count } = await supabase
            .from("team_members")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id)

          return { ...team, member_count: count || 0 }
        }),
      )

      setTeams(teamsWithCount)
    } catch (error: any) {
      toast({
        title: "Error fetching teams",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select(`
        id,
        user_id,
        role,
        joined_at,
        users!inner (
          email,
          full_name
        )
      `)
        .eq("team_id", teamId)

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error: any) {
      toast({
        title: "Error fetching team members",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setLoading(true)
    try {
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            name: newTeamName.trim(),
            description: newTeamDescription.trim(),
            owner_id: user?.id,
          },
        ])
        .select()
        .single()

      if (teamError) throw teamError

      // Add owner as team member
      const { error: memberError } = await supabase.from("team_members").insert([
        {
          team_id: teamData.id,
          user_id: user?.id,
          role: "owner",
        },
      ])

      if (memberError) throw memberError

      toast({
        title: "🎉 Team created!",
        description: `${newTeamName} has been created successfully.`,
      })

      setNewTeamName("")
      setNewTeamDescription("")
      fetchTeams()
    } catch (error: any) {
      toast({
        title: "Error creating team",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const joinTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setLoading(true)
    try {
      // Find team by invite code
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("invite_code", inviteCode.trim())
        .single()

      if (teamError) throw new Error("Invalid invite code")

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamData.id)
        .eq("user_id", user?.id)
        .single()

      if (existingMember) {
        throw new Error("You are already a member of this team")
      }

      // Add user to team
      const { error: memberError } = await supabase.from("team_members").insert([
        {
          team_id: teamData.id,
          user_id: user?.id,
          role: "member",
        },
      ])

      if (memberError) throw memberError

      toast({
        title: "🎉 Joined team!",
        description: `You've successfully joined ${teamData.name}.`,
      })

      setInviteCode("")
      fetchTeams()
    } catch (error: any) {
      toast({
        title: "Error joining team",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Invite code copied!",
      description: "Share this code with your team members.",
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-400" />
      case "admin":
        return <Shield className="w-4 h-4 text-blue-400" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl glass-dark border-0 glow-effect max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
          <CardTitle className="holographic-text flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Team Collaboration
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="teams" className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass border-0 m-4">
              <TabsTrigger
                value="teams"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                My Teams
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
              >
                Create Team
              </TabsTrigger>
              <TabsTrigger
                value="join"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                Join Team
              </TabsTrigger>
            </TabsList>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              <TabsContent value="teams" className="space-y-4 mt-0">
                {teams.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">No teams yet</h3>
                    <p className="text-gray-400 mb-4">Create or join a team to start collaborating!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => (
                      <Card
                        key={team.id}
                        className="glass border-0 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                        onClick={() => {
                          setSelectedTeam(team)
                          fetchTeamMembers(team.id)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-white">{team.name}</h4>
                              <p className="text-sm text-gray-400 mt-1">{team.description}</p>
                            </div>
                            <Badge className="glass border-0">{team.member_count || 0} members</Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyInviteCode(team.invite_code)
                                }}
                                className="text-gray-400 hover:text-white hover:bg-white/10"
                              >
                                <Copy className="w-4 h-4 mr-1" />
                                Invite
                              </Button>
                            </div>
                            <span className="text-xs text-gray-500">
                              Created {new Date(team.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Team Details Modal */}
                {selectedTeam && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
                    <Card className="w-full max-w-2xl glass-dark border-0 glow-effect">
                      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
                        <CardTitle className="holographic-text">{selectedTeam.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTeam(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardHeader>

                      <CardContent className="p-6 space-y-6">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Description</h4>
                          <p className="text-gray-400">{selectedTeam.description || "No description provided"}</p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-white">Invite Code</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyInviteCode(selectedTeam.invite_code)}
                              className="glass border-0 text-gray-300 hover:text-white hover:bg-white/10"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <code className="glass p-2 rounded text-sm text-gray-300 block">
                            {selectedTeam.invite_code}
                          </code>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-3">Team Members</h4>
                          <div className="space-y-2">
                            {teamMembers.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-3 glass rounded-lg">
                                <div className="flex items-center space-x-3">
                                  {getRoleIcon(member.role)}
                                  <div>
                                    <p className="text-white font-medium">
                                      {member.users.full_name || member.users.email}
                                    </p>
                                    <p className="text-sm text-gray-400">{member.users.email}</p>
                                  </div>
                                </div>
                                <Badge className="glass border-0 capitalize">{member.role}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="create" className="space-y-6 mt-0">
                <div className="text-center mb-6">
                  <Sparkles className="w-12 h-12 holographic-text mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Create a New Team</h3>
                  <p className="text-gray-400">Start collaborating with your team members</p>
                </div>

                <form onSubmit={createTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-gray-200">
                      Team Name
                    </Label>
                    <Input
                      id="teamName"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="e.g., Marketing Team, Development Squad"
                      className="glass border-0 text-white placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teamDescription" className="text-gray-200">
                      Description
                    </Label>
                    <Textarea
                      id="teamDescription"
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      placeholder="Describe what this team is working on..."
                      className="glass border-0 text-white placeholder:text-gray-400 min-h-[100px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !newTeamName.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 border-0 glow-effect transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="join" className="space-y-6 mt-0">
                <div className="text-center mb-6">
                  <UserPlus className="w-12 h-12 holographic-text mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-2">Join a Team</h3>
                  <p className="text-gray-400">Enter an invite code to join an existing team</p>
                </div>

                <form onSubmit={joinTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteCode" className="text-gray-200">
                      Invite Code
                    </Label>
                    <Input
                      id="inviteCode"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      placeholder="Enter the 8-character invite code"
                      className="glass border-0 text-white placeholder:text-gray-400"
                      maxLength={8}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !inviteCode.trim()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-0 glow-effect transition-all duration-300 transform hover:scale-105"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Team
                  </Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
