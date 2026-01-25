/**
 * WordPress REST API Client
 * Uses Application Password authentication
 */

import { WPCampus } from '@/lib/types/campus';

export class WordPressService {
  private baseUrl: string;
  private authHeader: string;

  constructor() {
    const wpUrl = process.env.WORDPRESS_URL;
    const wpUsername = process.env.WORDPRESS_USERNAME;
    const wpAppPassword = process.env.WORDPRESS_APP_PASSWORD;

    if (!wpUrl || !wpUsername || !wpAppPassword) {
      throw new Error('WordPress credentials not configured');
    }

    this.baseUrl = `${wpUrl}/wp-json/wp/v2`;

    // Application Password auth: base64(username:password)
    const credentials = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Create or update a post/custom post type
   */
  async upsertPost(data: WPCampus, postType: string = 'posts'): Promise<any> {
    const endpoint = `${this.baseUrl}/${postType}`;

    // Check if post already exists by MP congregation ID
    const existingPost = await this.findPostByMPId(data.acf?.mp_congregation_id || data.meta?.mp_congregation_id, postType);

    const method = existingPost ? 'PUT' : 'POST';
    const url = existingPost ? `${endpoint}/${existingPost.id}` : endpoint;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.authHeader,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Find a post by MinistryPlatform congregation ID
   */
  async findPostByMPId(mpId: number | undefined, postType: string = 'posts'): Promise<any | null> {
    if (!mpId) return null;

    // Try ACF field first
    const acfQuery = `${this.baseUrl}/${postType}?acf_format=standard&meta_key=mp_congregation_id&meta_value=${mpId}`;

    const response = await fetch(acfQuery, {
      headers: {
        'Authorization': this.authHeader,
      },
    });

    if (!response.ok) {
      console.warn(`Could not search for existing post: ${response.status}`);
      return null;
    }

    const posts = await response.json();
    return posts.length > 0 ? posts[0] : null;
  }

  /**
   * Get all posts of a type
   */
  async getPosts(postType: string = 'posts', params: Record<string, any> = {}): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}/${postType}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': this.authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number, postType: string = 'posts'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${postType}/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': this.authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WordPress API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Test connection to WordPress
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': this.authHeader,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
