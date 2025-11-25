#!/usr/bin/env node

/**
 * Mermaid 语法验证工具
 * 用法: node validate-mermaid.js <markdown文件路径>
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ 终极符号表：常用特殊字符转义速查表                                              │
 * ├──────┬──────┬────────────────┬──────────────┬─────────────────────────────┤
 * │ 字符 │ 名称 │ 常见冲突场景   │ 推荐转义方法 │ 示例 (Mermaid 代码)         │
 * ├──────┼──────┼────────────────┼──────────────┼─────────────────────────────┤
 * │ ( )  │圆括号│流程图节点定义  │字符串引号    │A("这是一个(括号)示例")      │
 * │ [ ]  │方括号│流程图节点定义  │字符串引号    │A["这是一个[方括号]示例"]    │
 * │ { }  │花括号│流程图节点定义  │字符串引号    │A{"这是一个{花括号}示例"}    │
 * │ < >  │尖括号│类图泛型、HTML  │HTML 实体编码 │class List { items: List&lt;String&gt; } │
 * │ :    │冒号  │时序图消息、状态│Mermaid 专属  │Alice->>Bob: 调用 a.run(arg#58; string) │
 * │ /    │斜杠  │URL 或文件路径  │直接使用      │state "路径: http#58;//tmp/..." │
 * │ "    │双引号│文中需要显示引号│Mermaid 专属  │A("他说: #34;你好#34;")      │
 * │ '    │单引号│文中需要显示引号│Mermaid 专属  │A("It#39;s a test")          │
 * │ `    │反引号│文中需要显示代码│Mermaid 专属  │A("这是一个 #96;codespan#96; 示例") │
 * │ #    │井号  │文中需要显示井号│Mermaid 专属  │A("这是一个 #35; 标签")      │
 * │ &    │和号  │文中需要显示和号│Mermaid 专属  │A("Tom #38; Jerry")          │
 * │ ;    │分号  │文中需要显示分号│Mermaid 专属  │A("这是一个;分号#59;")       │
 * ├──────┴──────┴────────────────┴──────────────┴─────────────────────────────┤
 * │ 特别注意：                                                                   │
 * │ • <<< >>> 在 Mermaid 中会导致解析错误，应避免使用                            │
 * │ • CUDA kernel 语法 kernel<<<grid,block>>>() 应改为 kernel(grid,block)       │
 * │ • HTML 标签如 <div> 应使用 &lt;div&gt; 或用引号包裹                          │
 * │ • 在 sequenceDiagram 中，activate/deactivate 必须在同一作用域内配对         │
 * │ • loop 内的 activate 必须在 loop 结束前 deactivate                          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('❌ 请提供 Markdown 文件路径')
  console.error('用法: node validate-mermaid.js <markdown文件路径>')
  console.error('示例: node validate-mermaid.js content/learn/Infra/ggml-source-code-brief.md')
  process.exit(1)
}

const filePath = args[0]

if (!fs.existsSync(filePath)) {
  console.error(`❌ 文件不存在: ${filePath}`)
  process.exit(1)
}

console.log(`📖 读取文件: ${filePath}\n`)

const content = fs.readFileSync(filePath, 'utf-8')

// 提取所有 mermaid 代码块
const mermaidRegex = /```mermaid\n([\s\S]*?)```/g
const matches = [...content.matchAll(mermaidRegex)]

if (matches.length === 0) {
  console.log('⚠️  未找到 mermaid 代码块')
  process.exit(0)
}

console.log(`🔍 找到 ${matches.length} 个 mermaid 图表\n`)

// 基础语法检查
function validateMermaidSyntax(code, index) {
  const lines = code.split('\n')  // 保留空行以保持正确的行号
  const errors = []
  const warnings = []
  
  // 检测图表类型
  const firstLine = lines[0]?.trim() || ''
  const isSequenceDiagram = firstLine === 'sequenceDiagram'
  const isFlowchart = firstLine.startsWith('graph ') || firstLine.startsWith('flowchart ')
  const isClassDiagram = firstLine === 'classDiagram'
  const isStateDiagram = firstLine.startsWith('stateDiagram')
  const isERDiagram = firstLine === 'erDiagram'
  
  // 通用检查（所有图表类型）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lineNum = i + 1
    
    // 检查特殊字符 <<< >>>
    if (line.includes('<<<') || line.includes('>>>')) {
      errors.push({
        line: lineNum,
        message: '❌ 包含特殊字符 "<<<" 或 ">>>"，Mermaid 无法解析。建议改为 "&#60;&#60;&#60;" 和 "&#62;&#62;&#62;"'
      })
    }
    
    // 检查 HTML 标签（未转义）
    const htmlTagRegex = /<(?!br|BR)([a-zA-Z]+)>/g
    const htmlMatches = line.match(htmlTagRegex)
    if (htmlMatches && !line.includes('&lt;') && !line.includes('&gt;')) {
      warnings.push({
        line: lineNum,
        message: '⚠️  包含 HTML 标签 ' + htmlMatches.join(', ') + '，建议使用 &lt; 和 &gt; 转义'
      })
    }
  }
  
  // 时序图特定检查
  if (isSequenceDiagram) {
    // 跟踪 activate/deactivate 状态
    const activatedParticipants = new Map() // participant -> [line numbers]
    const loopStack = [] // 跟踪 loop 嵌套
    
    for (let i = 1; i < lines.length; i++) {  // 从第2行开始，跳过 sequenceDiagram
      const line = lines[i].trim()
      const lineNum = i + 1
      
      // 跳过注释行
      if (line.startsWith('%%')) continue
      
      // 检测 loop 开始
      if (line.startsWith('loop ')) {
        loopStack.push({ line: lineNum, activations: new Set() })
      }
      
      // 检测 loop 结束
      if (line === 'end') {
        if (loopStack.length > 0) {
          const loop = loopStack.pop()
          // 检查 loop 内的激活是否都已失活
          loop.activations.forEach(participant => {
            if (activatedParticipants.has(participant)) {
              errors.push({
                line: lineNum,
                message: '❌ Participant "' + participant + '" 在 loop (line ' + loop.line + ') 内被激活但未在 loop 结束前失活'
              })
            }
          })
        }
      }
      
      // 检测 activate
      if (line.startsWith('activate ')) {
        const participant = line.replace('activate ', '').trim()
        if (!activatedParticipants.has(participant)) {
          activatedParticipants.set(participant, [])
        }
        activatedParticipants.get(participant).push(lineNum)
        
        // 如果在 loop 内，记录
        if (loopStack.length > 0) {
          loopStack[loopStack.length - 1].activations.add(participant)
        }
      }
      
      // 检测 deactivate
      if (line.startsWith('deactivate ')) {
        const participant = line.replace('deactivate ', '').trim()
        if (!activatedParticipants.has(participant)) {
          errors.push({
            line: lineNum,
            message: '❌ 尝试 deactivate 未激活的 participant: "' + participant + '"'
          })
        } else {
          activatedParticipants.delete(participant)
          
          // 从 loop 的激活集合中移除
          if (loopStack.length > 0) {
            loopStack[loopStack.length - 1].activations.delete(participant)
          }
        }
      }
      
      // 检查箭头语法
      const arrowRegex = /->|-->|=>|==>|<-|<--|<=|<==/g
      const arrows = line.match(arrowRegex)
      if (arrows && !line.includes('->>') && !line.includes('-->>')) {
        warnings.push({
          line: lineNum,
          message: '⚠️  使用了 ' + arrows.join(', ') + ' 箭头，在时序图中应使用 ->> 或 -->>'
        })
      }
      
      // 检查括号匹配
      const brackets = {
        '(': ')',
        '[': ']',
        '{': '}'
      }
      const stack = []
      for (let char of line) {
        if (brackets[char]) {
          stack.push(char)
        } else if (Object.values(brackets).includes(char)) {
          const last = stack.pop()
          if (brackets[last] !== char) {
            warnings.push({
              line: lineNum,
              message: '⚠️  括号不匹配: 期望 ' + (brackets[last] || '无') + ' 但找到 ' + char
            })
            break
          }
        }
      }
      if (stack.length > 0) {
        warnings.push({
          line: lineNum,
          message: '⚠️  括号未闭合: 缺少 ' + stack.map(c => brackets[c]).join(', ')
        })
      }
      
      // 检查常见的未转义字符
      const needEscapeChars = [
        { char: '#', context: '井号', suggestion: '使用 #35; 或引号包裹' },
        { char: '&', context: '和号', suggestion: '使用 #38; 或 &amp;' },
        { char: ';', context: '分号', suggestion: '使用 #59; 或引号包裹' }
      ]
      
      needEscapeChars.forEach(({ char, context, suggestion }) => {
        // 跳过空行和注释行
        if (!line.trim() || line.startsWith('%%')) return
        
        // 排除已经是转义序列的情况（如 &#35; 或 &amp;）
        if (char === '&') {
          // 对于 &，检查是否是 HTML 实体的一部分（&#数字; 或 &单词;）
          const htmlEntityRegex = /&(?:#\d+|[a-z]+);/gi
          const cleanedLine = line.replace(htmlEntityRegex, '')  // 移除所有 HTML 实体
          if (cleanedLine.includes('&')) {
            warnings.push({
              line: lineNum,
              message: '⚠️  包含未转义的' + context + ' "' + char + '"，可能导致渲染问题。' + suggestion
            })
          }
        } else if (char === ';') {
          // 对于 ;，检查是否是 HTML 实体的结尾
          const htmlEntityRegex = /&(?:#\d+|[a-z]+);/gi
          const cleanedLine = line.replace(htmlEntityRegex, '')  // 移除所有 HTML 实体
          if (cleanedLine.includes(';')) {
            warnings.push({
              line: lineNum,
              message: '⚠️  包含未转义的' + context + ' "' + char + '"，可能导致渲染问题。' + suggestion
            })
          }
        } else {
          // 对于其他字符（如 #），使用原来的逻辑
          const unescapedRegex = new RegExp(`(?<!&)${char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\d+;)`, 'g')
          if (unescapedRegex.test(line) && !line.includes(`#${char.charCodeAt(0)};`)) {
            warnings.push({
              line: lineNum,
              message: '⚠️  包含未转义的' + context + ' "' + char + '"，可能导致渲染问题。' + suggestion
            })
          }
        }
      })
    }
    
    // 检查是否有未 deactivate 的 participant
    if (activatedParticipants.size > 0) {
      activatedParticipants.forEach((lines, participant) => {
        errors.push({
          line: lines[lines.length - 1],
          message: '❌ Participant "' + participant + '" 被激活但从未失活 (activated at lines: ' + lines.join(', ') + ')'
        })
      })
    }
    
    // 检查未闭合的 loop
    if (loopStack.length > 0) {
      loopStack.forEach(loop => {
        errors.push({
          line: loop.line,
          message: '❌ Loop 未闭合 (started at line ' + loop.line + ')'
        })
      })
    }
  }
  
  // 流程图特定检查
  if (isFlowchart) {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNum = i + 1
      
      // 跳过注释和 subgraph
      if (line.startsWith('%%') || line.startsWith('subgraph') || line === 'end') continue
      
      // 检查节点定义中的括号匹配
      const nodeDefRegex = /([A-Za-z0-9_]+)\[([^\]]*)\]|([A-Za-z0-9_]+)\(([^)]*)\)|([A-Za-z0-9_]+)\{([^}]*)\}/
      const nodeMatch = line.match(nodeDefRegex)
      if (nodeMatch) {
        const nodeText = nodeMatch[2] || nodeMatch[4] || nodeMatch[6]
        if (nodeText && (nodeText.includes('[') || nodeText.includes('(') || nodeText.includes('{'))) {
          warnings.push({
            line: lineNum,
            message: '⚠️  节点文本包含括号，建议用引号包裹: ' + nodeText.substring(0, 30) + '...'
          })
        }
      }
    }
  }
  
  // 类图特定检查
  if (isClassDiagram) {
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNum = i + 1
      
      if (line.startsWith('%%')) continue
      
      // 检查泛型语法
      if (line.includes('<') && line.includes('>') && !line.includes('&lt;') && !line.includes('&gt;')) {
        warnings.push({
          line: lineNum,
          message: '⚠️  泛型语法应使用 &lt; 和 &gt; 转义，如: List&lt;String&gt;'
        })
      }
    }
  }
  
  // 状态图特定检查
  if (isStateDiagram) {
    const stateStack = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNum = i + 1
      
      if (line.startsWith('%%')) continue
      
      // 检查状态嵌套
      if (line.startsWith('state ') && line.includes('{')) {
        stateStack.push(lineNum)
      }
      if (line === '}') {
        if (stateStack.length === 0) {
          errors.push({
            line: lineNum,
            message: '❌ 多余的闭合括号 \'}\'，没有对应的状态定义'
          })
        } else {
          stateStack.pop()
        }
      }
    }
    
    if (stateStack.length > 0) {
      errors.push({
        line: stateStack[stateStack.length - 1],
        message: '❌ 状态定义未闭合，缺少 ' + stateStack.length + ' 个 \'}\''
      })
    }
  }
  
  return { errors, warnings, lineCount: lines.length, diagramType: firstLine }
}

// 验证每个图表
let hasErrors = false
matches.forEach((match, index) => {
  const code = match[1]
  const result = validateMermaidSyntax(code, index)
  
  console.log(`\n📊 图表 ${index + 1}:`)
  console.log(`   行数: ${result.lineCount}`)
  console.log(`   类型: ${result.diagramType}`)
  
  if (result.errors.length > 0) {
    hasErrors = true
    console.log(`\n   ❌ 发现 ${result.errors.length} 个错误:`)
    result.errors.forEach(err => {
      console.log(`      Line ${err.line}: ${err.message}`)
    })
  }
  
  if (result.warnings.length > 0) {
    console.log(`\n   ⚠️  发现 ${result.warnings.length} 个警告:`)
    result.warnings.forEach(warn => {
      console.log(`      Line ${warn.line}: ${warn.message}`)
    })
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log(`   ✅ 语法检查通过`)
  }
  
  // 保存到临时文件用于在线验证
  const outputFile = `mermaid-diagram-${index + 1}.mmd`
  fs.writeFileSync(outputFile, code)
  console.log(`\n   💾 已保存到: ${outputFile}`)
  console.log(`   🔗 在线验证: https://mermaid.live`)
})

console.log('\n' + '='.repeat(60))
if (hasErrors) {
  console.log('❌ 验证失败: 发现语法错误')
  console.log('\n💡 建议:')
  console.log('   1. 检查上述错误信息并修复')
  console.log('   2. 将 .mmd 文件内容粘贴到 https://mermaid.live 查看详细错误')
  console.log('   3. 确保所有 activate 都有对应的 deactivate')
  console.log('   4. 确保 loop 内的 activate 在 loop 结束前 deactivate')
  console.log('   5. 避免使用 <<< 和 >>> 等特殊字符')
  console.log('   6. HTML 标签需要转义为 &lt; 和 &gt;')
  console.log('\n🧹 清理临时文件:')
  console.log('   检查完 .mmd 文件后，运行以下命令删除临时文件:')
  console.log('   \x1b[33mrm -rf mermaid*.mmd\x1b[0m')
  process.exit(1)
} else {
  console.log('✅ 所有图表语法检查通过')
  console.log('\n🧹 清理临时文件:')
  console.log('   检查完 .mmd 文件后，运行以下命令删除临时文件:')
  console.log('   \x1b[33mrm -rf mermaid*.mmd\x1b[0m')
  console.log('\n💡 提示:')
  console.log('   • 可以将 .mmd 文件粘贴到 https://mermaid.live 进行在线验证')
  console.log('   • 如果在线验证也通过，说明语法完全正确')
  process.exit(0)
}

