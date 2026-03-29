class Marky < Formula
  desc "Local-first markdown workspace for browsing and editing notes"
  homepage "https://github.com/romankarski/Marky"
  version "0.1.1"
  url "https://github.com/romankarski/Marky/releases/download/v0.1.1/marky-0.1.1.tgz"
  sha256 "0019dfc4b32d63c1392aa264aed2253c1e0c2fb09216f8e2cc269bbfb8bb49b5"
  license "MIT"

  depends_on "node"

  def install
    cache_dir = buildpath/".npm-cache"

    cd "package" do
      system Formula["node"].opt_bin/"npm", "install", "--omit=dev", "--cache", cache_dir
    end

    libexec.install "package"

    (bin/"marky").write <<~SH
      #!/bin/bash
      exec "#{Formula["node"].opt_bin}/node" "#{libexec}/package/server/dist/cli.js" "$@"
    SH
  end

  test do
    (testpath/"note.md").write("# hello from homebrew\n")
    output = shell_output("#{bin}/marky --no-open #{testpath} 2>&1", 1)
    assert_match "http://127.0.0.1:", output
  end
end
