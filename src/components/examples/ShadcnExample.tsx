"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Users, Clock } from "lucide-react"

// This is an example component showing how to use shadcn/ui components
// integrated with the Danish minimalist design system
export function ShadcnExample() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-latte-800">shadcn/ui Integration Demo</h1>
        <p className="text-pearl-700">Examples of shadcn/ui components styled with the Danish minimalist design</p>
      </div>

      {/* Button Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Button Components
          </CardTitle>
          <CardDescription>
            Various button styles that work with the existing design system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Form Components
          </CardTitle>
          <CardDescription>
            Input fields and form elements with consistent styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trip-name">Trip Name</Label>
              <Input id="trip-name" placeholder="Enter trip name..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="copenhagen">Copenhagen</SelectItem>
                  <SelectItem value="aarhus">Aarhus</SelectItem>
                  <SelectItem value="odense">Odense</SelectItem>
                  <SelectItem value="aalborg">Aalborg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Trip Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the purpose and details of the trip..."
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Badge and Status Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Components
          </CardTitle>
          <CardDescription>
            Badges and status indicators for travel information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Cancelled</Badge>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium">Trip Status Examples:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                Confirmed
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                Pending
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                In Progress
              </Badge>
              <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                Completed
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-pearl-600">
            These components automatically adapt to your Danish minimalist color palette
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}