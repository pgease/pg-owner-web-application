import { AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface OwnerContentPageProps {
  queryKey: string;
  fallbackTitle: string;
  fetcher: () => Promise<{ title: string; body: string; updatedAt?: string }>;
}

export function OwnerContentPage({ queryKey, fallbackTitle, fetcher }: OwnerContentPageProps) {
  const q = useQuery({
    queryKey: ["owner-content", queryKey],
    queryFn: fetcher,
  });

  const title = q.data?.title || fallbackTitle;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={title} description="This page is API-ready and currently showing fallback content." />

      {q.isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading content...
          </CardContent>
        </Card>
      ) : null}

      {q.isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load from API</AlertTitle>
          <AlertDescription>
            Showing fallback content for now. Once backend endpoint is available, this page will display API response.
          </AlertDescription>
        </Alert>
      ) : null}

      {!q.isLoading ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge variant="outline">{q.data?.updatedAt || "Draft"}</Badge>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap leading-7 text-sm text-foreground">{q.data?.body}</div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
