const categoryImages: Record<string, string> = {
  "Food & Dining": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&fit=crop",
  "Food":          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&fit=crop",
  "Retail":        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80&fit=crop",
  "Automotive":    "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=600&q=80&fit=crop",
  "Entertainment": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80&fit=crop",
  "Local Business":"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80&fit=crop",
  "Health":        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop",
  "Groceries":     "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&fit=crop",
  "Fashion":       "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80&fit=crop",
  "Electronics":   "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80&fit=crop",
  "Travel":        "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80&fit=crop",
  "Beauty":        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80&fit=crop",
  "Fitness":       "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&fit=crop",
  "App Required":  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80&fit=crop",
  "Footwear":      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop",
  "Kids & Baby":   "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=80&fit=crop",
  "Sports":        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80&fit=crop",
  "Education":     "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80&fit=crop",
  "Home":          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&fit=crop",
  "Gifts":         "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80&fit=crop",
};

export function getCategoryImage(category: string): string {
  return (
    categoryImages[category] ??
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&fit=crop"
  );
}
