const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');

// 获取所有入队申请
router.get('/', async (req, res) => {
  const { status } = req.query;
  
  try {
    let query = supabase.from('team_join_requests').select('*');
    
    // 如果提供了状态参数，则按状态筛选
    if (status) {
      query = query.eq('status', status.toUpperCase());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error('获取入队申请列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取入队申请列表失败',
      error: error.message
    });
  }
});

// 获取特定团队的所有入队申请
router.get('/team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const { status } = req.query;
  
  try {
    let query = supabase
      .from('team_join_requests')
      .select('*')
      .eq('team_id', teamId);
    
    // 如果提供了状态参数，则按状态筛选
    if (status) {
      query = query.eq('status', status.toUpperCase());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error(`获取团队 ${teamId} 的入队申请失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取团队入队申请失败',
      error: error.message
    });
  }
});

// 获取特定团队的待处理申请数量
router.get('/team/:teamId/count', async (req, res) => {
  const { teamId } = req.params;
  const { status = 'PENDING' } = req.query; // 默认获取待处理申请
  
  try {
    const { count, error } = await supabase
      .from('team_join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('status', status.toUpperCase());
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      team_id: teamId,
      request_status: status.toUpperCase(),
      count: count || 0
    });
  } catch (error) {
    console.error(`获取团队 ${teamId} 的申请数量失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取申请数量失败',
      error: error.message
    });
  }
});

// 获取用户的所有入队申请
router.get('/applicant/:address', async (req, res) => {
  const { address } = req.params;
  const { status } = req.query;
  
  try {
    let query = supabase
      .from('team_join_requests')
      .select(`
        *,
        team:team_id(id, name, captain_address)
      `)
      .eq('applicant', address);
    
    // 如果提供了状态参数，则按状态筛选
    if (status) {
      query = query.eq('status', status.toUpperCase());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error(`获取用户 ${address} 的入队申请失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取用户入队申请失败',
      error: error.message
    });
  }
});

// 创建入队申请
router.post('/', async (req, res) => {
  // 从请求中提取参数，支持驼峰命名和下划线命名
  const { 
    applicant, 
    teamId, team_id, 
    name, 
    role 
  } = req.body;
  
  // 优先使用team_id，如果没有则使用teamId
  const actualTeamId = team_id !== undefined ? team_id : teamId;
  
  // 验证必要的参数
  if (!applicant || actualTeamId === undefined || !name || role === undefined) {
    return res.status(400).json({
      status: 'error',
      message: '缺少必要参数',
      required: {
        applicant: '申请人地址',
        teamId或team_id: '团队ID', 
        name: '申请人名称',
        role: '申请角色'
      },
      received: req.body
    });
  }
  
  try {
    // 检查是否已经是团队成员
    const { data: existingMember, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('address', applicant)
      .eq('team_id', actualTeamId)
      .maybeSingle();
    
    if (memberError) throw memberError;
    
    if (existingMember) {
      return res.status(409).json({
        status: 'error',
        message: '已经是团队成员，无需申请'
      });
    }
    
    // 检查是否已有待处理的申请
    const { data: existingRequest, error: requestError } = await supabase
      .from('team_join_requests')
      .select('id')
      .eq('applicant', applicant)
      .eq('team_id', actualTeamId)
      .eq('status', 'PENDING')
      .maybeSingle();
    
    if (requestError) throw requestError;
    
    if (existingRequest) {
      return res.status(409).json({
        status: 'error',
        message: '已有待处理的入队申请'
      });
    }
    
    // 创建新的入队申请 - 确保使用下划线命名与数据库字段匹配
    const { data, error } = await supabase
      .from('team_join_requests')
      .insert([
        {
          applicant,
          team_id: actualTeamId,  // 确保使用正确的字段名称
          name,
          role,
          status: 'PENDING'
        }
      ])
      .select();
    
    if (error) throw error;
    
    res.status(201).json({
      status: 'success',
      message: '入队申请已创建',
      data: data[0]
    });
  } catch (error) {
    console.error('创建入队申请失败:', error);
    res.status(500).json({
      status: 'error',
      message: '创建入队申请失败',
      error: error.message
    });
  }
});

// 处理入队申请(批准或拒绝)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
    return res.status(400).json({
      status: 'error',
      message: '状态参数无效，必须为 APPROVED 或 REJECTED'
    });
  }
  
  try {
    // 更新申请状态
    const { data, error } = await supabase
      .from('team_join_requests')
      .update({ status: status.toUpperCase() })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '申请不存在'
      });
    }
  
    res.status(200).json({
      status: 'success',
      message: `申请已${status.toUpperCase() === 'APPROVED' ? '批准' : '拒绝'}`,
      data: data[0]
    });
  } catch (error) {
    console.error(`处理申请ID=${id}失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '处理申请失败',
      error: error.message
    });
  }
});

// 获取特定团队的申请统计信息（待处理/已批准/已拒绝的数量）
router.get('/team/:teamId/stats', async (req, res) => {
  const { teamId } = req.params;
  
  try {
    // 获取各种状态的申请数量
    const stats = {};
    const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
    
    for (const status of statuses) {
      const { count, error } = await supabase
        .from('team_join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', status);
      
      if (error) throw error;
      stats[status.toLowerCase()] = count || 0;
    }
    
    // 获取总申请数
    const { count: total, error: totalError } = await supabase
      .from('team_join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);
    
    if (totalError) throw totalError;
    
    res.status(200).json({
      status: 'success',
      team_id: teamId,
      stats: {
        total: total || 0,
        ...stats
      }
    });
  } catch (error) {
    console.error(`获取团队 ${teamId} 的申请统计信息失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取申请统计信息失败',
      error: error.message
    });
  }
});

module.exports = router; 