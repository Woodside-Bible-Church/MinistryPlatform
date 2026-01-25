<?php
/**
 * WordPress Code Snippet to expose location meta fields to REST API
 *
 * Add this to your theme's functions.php or via Code Snippets plugin
 */

// Register location meta fields with REST API
add_action('rest_api_init', function() {
    $location_fields = [
        'location_id',
        'location_info_services',
        'location_info_additional',
        'location_info_phone',
        'location_info_address',
        'location_info_announcements',
        'location_info_calendar',
    ];

    foreach ($location_fields as $field) {
        register_rest_field('page', $field, [
            'get_callback' => function($object) use ($field) {
                return get_post_meta($object['id'], $field, true);
            },
            'update_callback' => function($value, $object) use ($field) {
                return update_post_meta($object->ID, $field, $value);
            },
            'schema' => [
                'type' => 'string',
                'description' => "Location field: {$field}",
                'context' => ['view', 'edit'],
            ],
        ]);
    }
});

// Also expose to ACF format for consistency
add_filter('rest_prepare_page', function($response, $post) {
    $location_fields = [
        'location_id',
        'location_info_services',
        'location_info_additional',
        'location_info_phone',
        'location_info_address',
        'location_info_announcements',
        'location_info_calendar',
    ];

    foreach ($location_fields as $field) {
        $value = get_post_meta($post->ID, $field, true);
        if ($value) {
            $response->data[$field] = $value;
        }
    }

    return $response;
}, 10, 2);
