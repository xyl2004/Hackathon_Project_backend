const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');

// 获取所有团队
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*');
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error('获取团队列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取团队列表失败',
      error: error.message
    });
  }
});

// 获取特定团队
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: '团队不存在'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error(`获取团队ID=${id}失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取团队详情失败',
      error: error.message
    });
  }
});

// 通过队长地址获取团队
router.get('/captain/:address', async (req, res) => {
  const { address } = req.params;
  
  try {
    console.log(`尝试获取队长地址为 ${address} 的团队...`);
    
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('captain_address', address)
      .single();
    
    console.log(`查询结果:`, { data, error });
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`未找到队长 ${address} 的团队`);
        return res.status(200).json({
          status: 'success',
          isCaptain: false,
          message: '未找到该队长的团队',
          team: null
        });
      }
      console.error(`数据库错误:`, error);
      throw error;
    }
    
    // 符合前端API格式的响应
    console.log(`成功获取队长 ${address} 的团队:`, data);
    res.status(200).json({
      status: 'success',
      isCaptain: true,
      team: data
    });
  } catch (error) {
    console.error(`获取队长 ${address} 的团队失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取团队详情失败',
      error: error.message
    });
  }
});

// 获取队伍待处理申请数量
router.get('/:id/pending-count', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 查询待处理的申请数量
    const { count, error } = await supabase
      .from('team_join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', id)
      .eq('status', 'PENDING');
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      count: count || 0
    });
  } catch (error) {
    console.error(`获取团队 ${id} 的待处理申请数量失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取待处理申请数量失败',
      error: error.message
    });
  }
});

// 获取团队的所有入队申请
router.get('/:id/requests', async (req, res) => {
  const { id } = req.params;
  const { status } = req.query;
  
  try {
    let query = supabase
      .from('team_join_requests')
      .select('*')
      .eq('team_id', id);
    
    // 如果提供了状态参数，则按状态筛选
    if (status) {
      query = query.eq('status', status.toUpperCase());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      team_id: id,
      requests: data
    });
  } catch (error) {
    console.error(`获取团队 ${id} 的入队申请失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取团队入队申请失败',
      error: error.message
    });
  }
});

module.exports = router; 