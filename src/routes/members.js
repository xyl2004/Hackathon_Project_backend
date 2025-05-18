const express = require('express');
const router = express.Router();
const { supabase } = require('../supabase');

// 获取所有成员
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*');
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error('获取成员列表失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取成员列表失败',
      error: error.message
    });
  }
});

// 获取特定团队的所有成员
router.get('/team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('team_id', teamId);
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error(`获取团队 ${teamId} 的成员失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取团队成员失败',
      error: error.message
    });
  }
});

// 获取特定成员
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({
        status: 'error',
        message: '成员不存在'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error(`获取成员ID=${id}失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取成员详情失败',
      error: error.message
    });
  }
});

// 通过钱包地址获取成员
router.get('/address/:address', async (req, res) => {
  const { address } = req.params;
  
  try {
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        teams:team_id(*)
      `)
      .eq('address', address)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          status: 'error',
          message: '未找到该地址的成员'
        });
      }
      throw error;
    }
    
    res.status(200).json({
      status: 'success',
      data: data
    });
  } catch (error) {
    console.error(`获取地址 ${address} 的成员失败:`, error);
    res.status(500).json({
      status: 'error',
      message: '获取成员详情失败',
      error: error.message
    });
  }
});

module.exports = router; 