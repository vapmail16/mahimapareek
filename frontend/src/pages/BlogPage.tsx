import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { postsApi, categoriesApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get("category");

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["posts", "published", categoryId],
    queryFn: () =>
      postsApi.getAll({
        status: "PUBLISHED",
        ...(categoryId && { categoryId }),
      }),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(),
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-muted-foreground">
          Explore our latest articles and educational content.
        </p>
      </div>

      {/* Category Filter */}
      {categoriesLoading ? (
        <div className="mb-8">Loading categories...</div>
      ) : categories && categories.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={!categoryId ? "default" : "outline"}
            onClick={() => setSearchParams({})}
          >
            All
          </Button>
          {categories.map((category: any) => (
            <Button
              key={category.id}
              variant={categoryId === category.id ? "default" : "outline"}
              onClick={() => setSearchParams({ category: category.id })}
            >
              {category.name}
            </Button>
          ))}
        </div>
      ) : null}

      {/* Posts List */}
      {postsLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt || post.content?.substring(0, 150) + "..."}
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
    </div>
  );
}

