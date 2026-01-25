<?php
/**
 * Plugin Name: Woodside MP Location Sync
 * Description: Custom REST API endpoint to sync MinistryPlatform location data to WordPress
 * Version: 1.0
 * Author: Woodside Bible Church
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Woodside_MP_Sync {

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register custom REST API routes
     */
    public function register_routes() {
        register_rest_route('woodside/v1', '/location/(?P<id>\d+)', [
            'methods' => 'POST',
            'callback' => [$this, 'update_location'],
            'permission_callback' => [$this, 'check_permissions'],
            'args' => [
                'id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
            ],
        ]);

        // Also add a GET endpoint to retrieve location data
        register_rest_route('woodside/v1', '/location/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_location'],
            'permission_callback' => [$this, 'check_permissions'],
        ]);
    }

    /**
     * Check if user is authenticated
     */
    public function check_permissions() {
        return current_user_can('edit_pages');
    }

    /**
     * Get location data including all meta fields
     */
    public function get_location($request) {
        $page_id = $request['id'];
        $page = get_post($page_id);

        if (!$page || $page->post_type !== 'page') {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        // Get all location meta fields
        $location_data = [
            'id' => $page->ID,
            'title' => $page->post_title,
            'slug' => $page->post_name,
            'location_id' => get_post_meta($page->ID, 'location_id', true),
            'location_info_services' => get_post_meta($page->ID, 'location_info_services', true),
            'location_info_additional' => get_post_meta($page->ID, 'location_info_additional', true),
            'location_info_phone' => get_post_meta($page->ID, 'location_info_phone', true),
            'location_info_address' => get_post_meta($page->ID, 'location_info_address', true),
            'location_info_announcements' => get_post_meta($page->ID, 'location_info_announcements', true),
            'location_info_calendar' => get_post_meta($page->ID, 'location_info_calendar', true),
        ];

        return rest_ensure_response($location_data);
    }

    /**
     * Update location data
     */
    public function update_location($request) {
        $page_id = $request['id'];
        $page = get_post($page_id);

        if (!$page || $page->post_type !== 'page') {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        $data = $request->get_json_params();
        $updated_fields = [];

        // Update page title if provided
        if (isset($data['title'])) {
            wp_update_post([
                'ID' => $page_id,
                'post_title' => sanitize_text_field($data['title']),
            ]);
            $updated_fields[] = 'title';
        }

        // Update page content if provided
        if (isset($data['content'])) {
            wp_update_post([
                'ID' => $page_id,
                'post_content' => wp_kses_post($data['content']),
            ]);
            $updated_fields[] = 'content';
        }

        // Update location meta fields
        $meta_fields = [
            'location_id',
            'location_info_services',
            'location_info_additional',
            'location_info_phone',
            'location_info_address',
            'location_info_announcements',
            'location_info_calendar',
        ];

        foreach ($meta_fields as $field) {
            if (isset($data[$field])) {
                update_post_meta($page_id, $field, sanitize_text_field($data[$field]));
                $updated_fields[] = $field;
            }
        }

        // Return success response
        return rest_ensure_response([
            'success' => true,
            'page_id' => $page_id,
            'updated_fields' => $updated_fields,
            'message' => 'Location updated successfully',
        ]);
    }
}

// Initialize the plugin
new Woodside_MP_Sync();
