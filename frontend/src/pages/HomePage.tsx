import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { postsApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function HomePage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", "published"],
    queryFn: () => postsApi.getAll({ status: "PUBLISHED" }),
  });

  const featuredPosts = posts?.slice(0, 3) || [];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="mb-8 flex justify-center">
          <img 
            src="/hero-image.png" 
            alt="Mahima Pareek" 
            className="max-w-full h-auto max-h-96 rounded-lg shadow-lg"
          />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
          Welcome to Mahima Pareek
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Your trusted platform for education, learning, and academic excellence.
          Explore our resources, read our blog, and enhance your learning journey.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/ai-evaluation">
            <Button size="lg">Try AI Evaluation</Button>
          </Link>
          <Link to="/blog">
            <Button size="lg" variant="outline">Explore Blog</Button>
          </Link>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8">Latest Posts</h2>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : featuredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPosts.map((post: any) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {post.excerpt || post.content?.substring(0, 100) + "..."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : "Draft"}
                    </span>
                    <Link to={`/blog/${post.slug}`}>
                      <Button variant="outline" size="sm">
                        Read More
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {featuredPosts.length > 0 && (
          <div className="text-center mt-8">
            <Link to="/blog">
              <Button variant="outline">View All Posts</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

