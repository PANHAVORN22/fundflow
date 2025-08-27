"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Camera, Award, Sparkles } from "lucide-react";

export default function PhotoContestPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    purpose: "",
    amounts: "",
    description: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", { ...formData, uploadedFile });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full shadow-2xl border border-white/20">
        {/* Header with enhanced design */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Upload Your Details
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Share your creativity with us
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Full Name with enhanced styling */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              Full Name
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Email with enhanced styling */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
              E-mail
            </label>
            <Input
              type="email"
              placeholder="Ex: myname@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
            />
          </div>

          {/* Upload Photo with enhanced design */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              Upload Photo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/50 transition-all duration-300 group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full group-hover:scale-110 transition-transform duration-200">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-700 font-semibold text-lg">
                      Upload a file
                    </p>
                    <p className="text-gray-500 text-sm">
                      Drag and drop files here or click to browse
                    </p>
                  </div>
                  {uploadedFile && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />✓ {uploadedFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Purpose and Amounts Row with enhanced styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                Purpose
              </label>
              <Input
                placeholder="Type here...."
                value={formData.purpose}
                onChange={(e) => handleInputChange("purpose", e.target.value)}
                className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                Amounts
              </label>
              <Input
                placeholder="Amounts"
                value={formData.amounts}
                onChange={(e) => handleInputChange("amounts", e.target.value)}
                className="h-12 border-gray-200 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Description with enhanced styling */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              Description
            </label>
            <Textarea
              placeholder="Type here...."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="min-h-[140px] border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200 resize-none"
            />
          </div>

          {/* Submit Button with enhanced design */}
          <div className="pt-6">
            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
