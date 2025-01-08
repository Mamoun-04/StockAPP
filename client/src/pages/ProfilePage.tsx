import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon } from "lucide-react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url("Please enter a valid URL").optional().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      education: user?.education || "",
      occupation: user?.occupation || "",
      bio: user?.bio || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  const avatarUrl = watch("avatarUrl");

  // Reset preview error when URL changes
  useEffect(() => {
    setPreviewError(null);
  }, [avatarUrl]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details?.join(", ") || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({
        title: "Success",
        description: "Your profile has been updated!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      avatarUrl: data.avatarUrl?.trim() || null,
      bio: data.bio?.trim() || undefined,
      education: data.education?.trim() || undefined,
      occupation: data.occupation?.trim() || undefined,
      displayName: data.displayName?.trim() || undefined,
    };
    updateProfileMutation.mutate(cleanedData);
  };

  const handleImageLoad = () => {
    setIsPreviewLoading(false);
    setPreviewError(null);
  };

  const handleImageError = () => {
    setIsPreviewLoading(false);
    setPreviewError("Unable to load image from URL");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to view your profile
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Edit Profile</CardTitle>
              <div className="flex justify-center py-4">
                <Avatar className="w-24 h-24">
                  {avatarUrl && !previewError ? (
                    <AvatarImage
                      src={avatarUrl}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      alt="Profile"
                    />
                  ) : (
                    <AvatarFallback>
                      <ImageIcon className="w-12 h-12" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    {...register("displayName")}
                    placeholder="Enter your display name"
                  />
                  {errors.displayName && (
                    <p className="text-sm text-destructive">
                      {errors.displayName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    {...register("avatarUrl")}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {errors.avatarUrl && (
                    <p className="text-sm text-destructive">
                      {errors.avatarUrl.message}
                    </p>
                  )}
                  {previewError && (
                    <p className="text-sm text-destructive">
                      {previewError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    {...register("education")}
                    placeholder="Your educational background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    {...register("occupation")}
                    placeholder="Your current occupation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    {...register("bio")}
                    placeholder="Tell us about yourself"
                    className="min-h-[100px]"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}