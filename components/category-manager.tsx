"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { X, Plus, Edit, Trash2, Folder, Briefcase, Home, ShoppingCart, Heart, Star } from "lucide-react"

interface Category {
  id: string
  name: string
  color: string
  icon: string
}

interface CategoryManagerProps {
  categories: Category[]
  onClose: () => void
  onSuccess: () => void
}

const PRESET_COLORS = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#F43F5E",
]

const PRESET_ICONS = [
  { name: "folder", icon: Folder },
  { name: "briefcase", icon: Briefcase },
  { name: "home", icon: Home },
  { name: "shopping", icon: ShoppingCart },
  { name: "heart", icon: Heart },
  { name: "star", icon: Star },
]

export function CategoryManager({ categories, onClose, onSuccess }: CategoryManagerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0])
  const [newCategoryIcon, setNewCategoryIcon] = useState("folder")

  const supabase = getSupabaseClient()

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase.from("categories").insert([
        {
          name: newCategoryName.trim(),
          color: newCategoryColor,
          icon: newCategoryIcon,
          user_id: user?.id,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast({
        title: "Category created!",
        description: `${newCategoryName} has been added to your categories.`,
      })

      setNewCategoryName("")
      setNewCategoryColor(PRESET_COLORS[0])
      setNewCategoryIcon("folder")
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateCategory = async (category: Category) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: category.name,
          color: category.color,
          icon: category.icon,
        })
        .eq("id", category.id)
        .eq("user_id", user?.id)

      if (error) throw error

      toast({
        title: "Category updated!",
        description: "Your category has been updated successfully.",
      })

      setEditingCategory(null)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId).eq("user_id", user?.id)

      if (error) throw error

      toast({
        title: "Category deleted",
        description: "The category has been removed from your list.",
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const iconData = PRESET_ICONS.find((i) => i.name === iconName)
    return iconData ? iconData.icon : Folder
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-emerald-400">Manage Categories</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Create New Category */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300">Create New Category</h3>
            <form onSubmit={createCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName" className="text-slate-300">
                  Category Name
                </Label>
                <Input
                  id="categoryName"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Work, Personal, Shopping"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCategoryColor === color ? "border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((iconData) => {
                    const IconComponent = iconData.icon
                    return (
                      <button
                        key={iconData.name}
                        type="button"
                        onClick={() => setNewCategoryIcon(iconData.name)}
                        className={`p-2 rounded-lg border ${
                          newCategoryIcon === iconData.name
                            ? "border-emerald-500 bg-emerald-500/20"
                            : "border-slate-600 bg-slate-700"
                        }`}
                      >
                        <IconComponent className="w-5 h-5 text-slate-300" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !newCategoryName.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </form>
          </div>

          {/* Existing Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300">Your Categories</h3>
            {categories.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No categories yet. Create your first category above!</p>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => {
                  const IconComponent = getIconComponent(category.icon)

                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + "20" }}
                        >
                          <IconComponent className="w-5 h-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-200">{category.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <span className="text-xs text-slate-400 capitalize">{category.icon}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCategory(category)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCategory(category.id)}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-emerald-400">Edit Category</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Category Name</Label>
                <Input
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        setEditingCategory({
                          ...editingCategory,
                          color,
                        })
                      }
                      className={`w-8 h-8 rounded-full border-2 ${
                        editingCategory.color === color ? "border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((iconData) => {
                    const IconComponent = iconData.icon
                    return (
                      <button
                        key={iconData.name}
                        type="button"
                        onClick={() =>
                          setEditingCategory({
                            ...editingCategory,
                            icon: iconData.name,
                          })
                        }
                        className={`p-2 rounded-lg border ${
                          editingCategory.icon === iconData.name
                            ? "border-emerald-500 bg-emerald-500/20"
                            : "border-slate-600 bg-slate-700"
                        }`}
                      >
                        <IconComponent className="w-5 h-5 text-slate-300" />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateCategory(editingCategory)}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
