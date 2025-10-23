-- Check the current stored procedure parameters
SELECT
    p.name AS ProcedureName,
    param.name AS ParameterName,
    TYPE_NAME(param.user_type_id) AS ParameterType
FROM
    sys.procedures p
    INNER JOIN sys.parameters param ON p.object_id = param.object_id
WHERE
    p.name = 'api_Custom_User_Response_Stats_JSON'
ORDER BY
    param.parameter_id;
