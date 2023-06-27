# frida_intent
/**
 * @Time : 2023/6/28 22:00
 * @Author : Tesla
 * @Csdn : https://blog.csdn.net/zhu6201976
 *
 * Frida遍历启动App所有Activity/Service
 * attach模式:
 *     frida -UF -l hook_intent.js
 * spawn模式:
 *     frida -U -l hook_intent.js -f com.mosheng
 */
