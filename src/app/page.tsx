import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Settings, ArrowRight, Layers, Zap, ClipboardList } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container max-w-5xl mx-auto py-16 px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4">3D Configurator Platform</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Build Your Custom<br />3D Configurator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Get an instant quote and development plan for your product configurator.
            Start with a simple survey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/quote">
              <Button size="lg" className="text-lg px-8 h-14">
                <FileText className="size-5 mr-2" />
                Start Quote Survey
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </Link>
            <Link href="/quotes">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                <ClipboardList className="size-5 mr-2" />
                견적서 목록
              </Button>
            </Link>
            <Link href="/cpq-builder">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                <Settings className="size-5 mr-2" />
                CPQ Builder Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                <FileText className="size-6 text-primary" />
              </div>
              <CardTitle>Quick Survey</CardTitle>
              <CardDescription>
                Answer a few questions about your product and requirements to get started.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                <Zap className="size-6 text-primary" />
              </div>
              <CardTitle>Instant Estimate</CardTitle>
              <CardDescription>
                Get an immediate cost estimate and development timeline based on your needs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-2">
                <Layers className="size-6 text-primary" />
              </div>
              <CardTitle>Development Plan</CardTitle>
              <CardDescription>
                Receive a detailed project plan with phases, team allocation, and deliverables.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="border-2 bg-primary text-primary-foreground">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Complete our survey to receive a customized quote for your 3D configurator project.
              No commitment required.
            </p>
            <Link href="/quote">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Get Your Quote
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
