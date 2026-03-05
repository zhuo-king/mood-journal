// 全局变量：当前登录用户、本地存储key
let currentUser = null;
const USER_KEY = 'mood_users';       // 存储用户信息
const RECORD_KEY = 'mood_records';   // 存储记录信息

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // ========== 1. 登录注册功能 ==========
    initLoginRegister();


    // ========== 2. 素材插入功能（核心：插入图片而非路径） ==========
    initMaterialInsert();

    // ========== 3. 记录保存功能 ==========
    initRecordSave();

    // ========== 4. 导航切换（今日/历史记录） ==========
    initNavSwitch();

    // ========== 5. 自动加载历史记录（如果已登录） ==========
    checkLoginStatus();
});

// 1. 初始化登录注册
function initLoginRegister() {
    // 获取DOM元素
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    const loginModal = document.querySelector('.login-modal');
    const registerModal = document.querySelector('.register-modal');
    const loginClose = document.querySelector('.login-close');
    const regClose = document.querySelector('.reg-close');
    const loginSubmit = document.querySelector('.login-submit');
    const regSubmit = document.querySelector('.reg-submit');

    // 打开弹窗
    loginBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });
    registerBtn.addEventListener('click', () => {
        registerModal.style.display = 'flex';
    });

    // 关闭弹窗
    loginClose.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
    regClose.addEventListener('click', () => {
        registerModal.style.display = 'none';
    });

    // 点击弹窗外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
    });

    // 注册逻辑
    regSubmit.addEventListener('click', () => {
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value.trim();

        // 验证
        if (!username || !password) {
            alert('用户名和密码不能为空！');
            return;
        }

        // 读取已有用户
        const users = JSON.parse(localStorage.getItem(USER_KEY)) || [];
        const isExist = users.some(u => u.username === username);
        if (isExist) {
            alert('用户名已存在！');
            return;
        }

        // 保存用户
        users.push({ username, password });
        localStorage.setItem(USER_KEY, JSON.stringify(users));
        alert('注册成功！请登录');
        registerModal.style.display = 'none';
        // 清空输入框
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-password').value = '';
    });

    // 登录逻辑
    loginSubmit.addEventListener('click', () => {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        // 验证
        if (!username || !password) {
            alert('用户名和密码不能为空！');
            return;
        }

        // 验证用户
        const users = JSON.parse(localStorage.getItem(USER_KEY)) || [];
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) {
            alert('用户名或密码错误！');
            return;
        }

        // 登录成功
        currentUser = username;
        // 保存登录状态
        localStorage.setItem('current_user', username);
        // 更新页面
        document.querySelector('.user-name').textContent = `欢迎：${username}`;
        document.querySelector('.user-name').style.display = 'inline';
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        loginModal.style.display = 'none';
        alert(`欢迎回来，${username}！`);

        // 加载历史记录
        loadPastRecords();
    });
}

// 2. 初始化素材插入（核心：插入图片标签，而非路径）
function initMaterialInsert() {
    const materialImgs = document.querySelectorAll('.material-img');
    const contentBox = document.getElementById('content-box');

    materialImgs.forEach(img => {
        img.addEventListener('click', () => {
            // 未登录禁止插入
            if (!currentUser) {
                alert('请先登录！');
                document.querySelector('.login-modal').style.display = 'flex';
                return;
            }

            // 获取素材图片路径
            const imgSrc = img.getAttribute('data-src');
            // 创建图片元素
            const newImg = document.createElement('img');
            newImg.src = imgSrc;
            newImg.alt = '手账素材';
            newImg.style.width = '40px';
            newImg.style.height = '40px';
            newImg.style.verticalAlign = 'middle';
            newImg.style.margin = '0 5px';

            // 插入到光标位置
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents(); // 清除选中内容（如果有）
                range.insertNode(newImg);
                // 光标移到图片后
                range.setStartAfter(newImg);
                range.setEndAfter(newImg);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // 没有光标，直接追加
                contentBox.appendChild(newImg);
            }

            // 聚焦输入框
            contentBox.focus();
        });
    });
}

// 3. 初始化记录保存
function initRecordSave() {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.addEventListener('click', () => {
        // 未登录禁止保存
        if (!currentUser) {
            alert('请先登录！');
            document.querySelector('.login-modal').style.display = 'flex';
            return;
        }

        // 获取表单数据
        const quickMood = document.querySelector('input[name="quick-mood"]:checked')?.value || '';
        const date = document.getElementById('date-select').value;
        const weather = document.getElementById('weather-select').value;
        const moodDetail = document.getElementById('mood-detail-select').value;
        const content = document.getElementById('content-box').innerHTML.trim();

        // 验证
        if (!date || !weather || !moodDetail || !content) {
            alert('请完善日期、天气、详细心情和内容！');
            return;
        }

        // 构造记录对象
        const record = {
            id: Date.now(),          // 唯一ID
            username: currentUser,   // 关联用户
            quickMood: quickMood,    // 速选心情
            date: date,              // 日期
            weather: weather,        // 天气
            moodDetail: moodDetail,  // 详细心情
            content: content,        // 富文本内容（含图片）
            createTime: new Date().toLocaleString() // 创建时间
        };

        // 读取已有记录
        const records = JSON.parse(localStorage.getItem(RECORD_KEY)) || [];
        // 添加新记录
        records.push(record);
        // 保存到本地
        localStorage.setItem(RECORD_KEY, JSON.stringify(records));

        alert('记录保存成功！');
        // 重置表单
        resetForm();
        // 刷新历史记录
        loadPastRecords();
    });
}

// 4. 初始化导航切换
function initNavSwitch() {
    const todayNav = document.querySelector('.today-record');
    const pastNav = document.querySelector('.past-record');
    const todayForm = document.querySelector('.today-form');
    const pastRecords = document.querySelector('.past-records');

    // 今日记录
    todayNav.addEventListener('click', () => {
        todayForm.style.display = 'block';
        pastRecords.style.display = 'none';
    });

    // 历史记录
    pastNav.addEventListener('click', () => {
        todayForm.style.display = 'none';
        pastRecords.style.display = 'block';
        // 加载历史记录
        loadPastRecords();
    });
}

// 5. 检查登录状态（页面刷新后）
function checkLoginStatus() {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
        currentUser = savedUser;
        // 更新页面
        document.querySelector('.user-name').textContent = `欢迎：${savedUser}`;
        document.querySelector('.user-name').style.display = 'inline';
        document.querySelector('.login-btn').style.display = 'none';
        document.querySelector('.register-btn').style.display = 'none';
        // 加载历史记录
        loadPastRecords();
    }
}

// 辅助函数：加载历史记录（核心：不可修改）
function loadPastRecords() {
    if (!currentUser) return;

    const records = JSON.parse(localStorage.getItem(RECORD_KEY)) || [];
    // 筛选当前用户的记录
    const userRecords = records.filter(r => r.username === currentUser);
    const recordsList = document.getElementById('records-list');

    // 清空列表
    recordsList.innerHTML = '';

    // 无记录提示
    if (userRecords.length === 0) {
        recordsList.innerHTML = '<div style="text-align:center; padding:20px; color:#999;">暂无历史记录</div>';
        return;
    }

    // 渲染记录（倒序：最新的在前）
    userRecords.reverse().forEach(record => {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        recordItem.innerHTML = `
            <div class="record-header">
                <div><span>日期：</span>${record.date}</div>
                <div><span>天气：</span>${record.weather}</div>
                <div><span>心情：</span>${record.moodDetail}</div>
                <div><span>速选心情：</span>${record.quickMood || '未选择'}</div>
            </div>
            <div class="record-content">${record.content}</div>
        `;
        // 核心：设置内容不可编辑
        recordItem.querySelector('.record-content').contentEditable = false;
        recordsList.appendChild(recordItem);
    });
}

// 辅助函数：重置表单
function resetForm() {
    // 重置单选框
    document.querySelectorAll('input[name="quick-mood"]').forEach(radio => {
        radio.checked = false;
    });
    // 重置下拉框
    document.getElementById('date-select').value = '';
    document.getElementById('weather-select').value = '';
    document.getElementById('mood-detail-select').value = '';
    // 重置富文本框
    document.getElementById('content-box').innerHTML = '';
}