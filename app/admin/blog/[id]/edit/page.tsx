"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import BlogForm from "../../components/BlogForm";

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/blog/${params.id}`)
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        if (r.status === 404) { router.push("/admin/blog"); return null; }
        return r.json();
      })
      .then((data) => { if (data) setPost(data); })
      .catch(() => router.push("/admin/blog"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <BlogForm
      isEdit
      initialData={{
        id: post.id as string,
        title: post.title as string,
        subtitle: (post.subtitle as string) || "",
        category: post.category as string,
        content: post.content as string,
        excerpt: (post.excerpt as string) || "",
        imageUrl: (post.imageUrl as string) || "",
        images: (post.images as string[]) || [],
        author: (post.author as string) || "Real Duck Distro",
        published: post.published as boolean,
        featured: post.featured as boolean,
        tags: (post.tags as string[]) || [],
      }}
    />
  );
}
