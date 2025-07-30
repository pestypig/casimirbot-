import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'wouter';

interface ResearchPaper {
  id: string;
  title: string;
  filename: string;
  year: number;
  category: string;
  description: string;
  version?: string;
}

const RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: 'needle-hull-mk1',
    title: 'Needle Hull Mark 1: 83 MW Casimir Stress Geometry',
    filename: '83 MW Needle Hull Mark 1 update_1753733381119.pdf',
    year: 2025,
    category: 'Warp Bubble Physics',
    description: 'Comprehensive analysis of the Needle Hull Mk 1 configuration, targeting 1.405×10³ kg exotic mass generation with 83 MW power requirements for theoretical warp bubble applications.',
    version: '2025.1'
  },
  {
    id: 'geometry-amplified-casimir',
    title: 'Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator',
    filename: 'Geometry-Amplified Dynamic Casimir Effect in a Concave Microwave Micro-Resonator_1753733560411.pdf',
    year: 2025,
    category: 'Dynamic Casimir Effects',
    description: 'Investigation of geometric amplification factors in concave cavity geometries, achieving γ ≈ 25× blue-shift enhancement for dynamic boundary modulation.',
    version: '2025.1'
  },
  {
    id: 'time-sliced-strobing',
    title: 'Time-Sliced Sector Strobing Functions as a GR-Valid Proxy',
    filename: 'time-sliced sector strobing functions as a GR-valid proxy_1753733389106.pdf',
    year: 2025,
    category: 'General Relativity',
    description: 'Theoretical framework for sector strobing techniques ensuring General Relativistic validity through time-scale separation and Ford-Roman compliance.',
    version: '2025.1'
  },
  {
    id: 'bubble-metrics-checklist',
    title: 'CheckList of Bubble Metric Analysis',
    filename: 'CheckList of Bubble Metric_1753798567838.pdf',
    year: 2025,
    category: 'Methodology',
    description: 'Comprehensive verification checklist for warp bubble metric calculations, including quantum inequality bounds and stress-energy tensor validation.',
    version: '2025.1'
  }
];

export default function DocumentsPage() {
  const downloadPaper = (filename: string, title: string) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `/documents/${filename}`;
    link.download = filename;
    link.click();
  };

  const openPaper = (filename: string) => {
    window.open(`/documents/${filename}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <div className="hidden">
        <title>Research Papers - CasimirBot | Exotic Energy Physics Documentation</title>
        <meta name="description" content="Comprehensive collection of Casimir effect research papers, warp bubble physics studies, and exotic energy documentation from CasimirBot research platform." />
        <meta name="keywords" content="Casimir effect, warp bubble, exotic energy, dynamic Casimir, Needle Hull, quantum field theory, general relativity" />
        <meta property="og:title" content="CasimirBot Research Papers - Exotic Energy Physics Documentation" />
        <meta property="og:description" content="Access cutting-edge research on Casimir stress-energy physics, warp bubble configurations, and exotic mass generation techniques." />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index,follow" />
      </div>

      {/* Navigation Header */}
      <header className="border-b bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  ← Back to CasimirBot
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Research Documents</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Casimir Effect & Exotic Energy Physics Papers</p>
              </div>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Updated 2025
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* API Information */}
        <Card className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <ExternalLink className="h-5 w-5" />
              Programmatic Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 dark:text-blue-300 mb-2">
              For researchers and AI agents: Access paper metadata via our JSON API
            </p>
            <code className="bg-white dark:bg-gray-800 px-3 py-1 rounded text-sm font-mono">
              GET /api/papers
            </code>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Returns structured metadata for all available research papers
            </p>
          </CardContent>
        </Card>

        {/* Paper Categories */}
        <div className="space-y-8">
          {/* Group papers by category */}
          {Object.entries(
            RESEARCH_PAPERS.reduce((acc, paper) => {
              if (!acc[paper.category]) acc[paper.category] = [];
              acc[paper.category].push(paper);
              return acc;
            }, {} as Record<string, ResearchPaper[]>)
          ).map(([category, papers]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">
                {category}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {papers.map((paper) => (
                  <Card key={paper.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            {paper.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{paper.year}</Badge>
                            {paper.version && (
                              <Badge variant="secondary">v{paper.version}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                        {paper.description}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openPaper(paper.filename)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPaper(paper.filename, paper.title)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            CasimirBot Research Platform | For questions about these papers, visit{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              CasimirBot.com
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}