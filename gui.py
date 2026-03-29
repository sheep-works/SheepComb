import streamlit as st
import subprocess
import sys
import os

st.set_page_config(page_title="SheepComb GUI", layout="wide")

st.title("SheepComb Manager")

# Section 1: Add TM to CSV
st.header("1. Add TM to CSV")
st.write("設定(`config.json`)に基づいてCSVファイルにTM（Translation Memory）マッチ情報を追加します。")
with st.expander("詳細設定", expanded=True):
    st.info("※ この機能は `config.json` の `input_file`, `tms` などのパスを使用します。")
    if st.button("実行 (Add TM)", use_container_width=True, type="primary"):
        with st.spinner("処理中..."):
            result = subprocess.run(
                [sys.executable, "main.py", "--add-tm"],
                capture_output=True, text=True
            )
            if result.returncode == 0:
                st.success("完了しました！")
                with st.expander("実行ログ"):
                    st.code(result.stdout)
            else:
                st.error("エラーが発生しました。")
                st.code(result.stderr)

st.divider()

# Section 2: MXLIFF Hack
st.header("2. MXLIFF ロック処理 (xlfhack)")
st.write("類似の原文が存在する場合に、セグメントを自動でロック状態にします。")

with st.container():
    col1, col2 = st.columns(2)
    with col1:
        mxliff_file = st.text_input("MXLIFF 入力ファイルパス", "sample.docx.xlf")
        mxliff_mode = st.selectbox("比較モード (Mode)", ["char", "word"])
    with col2:
        mxliff_output = st.text_input("出力ファイルパス (空欄で上書きせずに別名保存)", "")
        mxliff_threshold = st.number_input("類似度 閾値 (Threshold: 0-100)", min_value=0.0, max_value=100.0, value=90.0)

if st.button("実行 (MXLIFF Hack)", use_container_width=True, type="primary"):
    if not mxliff_file:
        st.warning("入力ファイルパスを指定してください。")
    elif not os.path.exists(mxliff_file):
        st.warning("指定されたMXLIFFファイルが存在しません。正しいパスを入力してください。")
    else:
        with st.spinner("処理中..."):
            cmd = [
                sys.executable, "main.py", "--mxliff", mxliff_file,
                "--mode", mxliff_mode,
                "--threshold", str(mxliff_threshold)
            ]
            if mxliff_output:
                cmd.extend(["--output", mxliff_output])
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                st.success("完了しました！")
                with st.expander("実行ログ"):
                    st.code(result.stdout)
            else:
                st.error("エラーが発生しました。")
                st.code(result.stderr)
